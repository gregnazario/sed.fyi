/**
 * Execution engine for the parsed sed subset. Implements sed's
 * read-one-line → run-script → maybe-print cycle, plus the pieces real
 * scripts lean on: the hold space, GNU range extensions (~step, addr,+N,
 * range reopening), labels/branches, and `-n`.
 */

import type { Addr, Cmd, Node, Program, RangeSpec } from './parser'
import { parseProgram, SedSyntaxError } from './parser'
import { posixToJs } from './regex'

export interface RunOptions {
  /** Treat patterns as ERE (-E / -r) instead of BRE. */
  extendedRegex?: boolean
  /** Suppress automatic printing (-n). */
  quiet?: boolean
}

export type SedResult = { ok: true; output: string } | { ok: false; error: string }

/**
 * Safety valve so a script like `:a;ta` can't hang the tab. The floor is the
 * fixed budget; it scales with input so legitimate per-line scripts (like
 * `1!G;h;$!d` on big files) don't trip it, and the ceiling bounds worst case.
 */
const MIN_EXEC_STEPS = 250_000
const MAX_EXEC_STEPS = 5_000_000
const STEPS_PER_LINE_PER_NODE = 400

/** Branch signal: jump to a top-level node index (null = past end of script). */
class JumpSignal extends Error {
  constructor(public readonly target: number | null) {
    super('jump')
    this.name = 'JumpSignal'
  }
}

type Flow =
  | 'none' // keep executing
  | 'delete' // d: drop PS + queue, skip auto-print, next line
  | 'restartWithTrimmedPs' // D trimmed PS; rerun script without reading input
  | 'stopQuiet' // n hit EOF: nothing more gets printed at all
  | 'stopNormal' // N hit EOF: finish this cycle under normal auto-print rules
  | 'quit'

interface RangeState {
  active: boolean
  /** Lines still covered after activation, for `addr,+N`. */
  offsetLeft: number
}

class Engine {
  private readonly out: string[] = []
  private ps = ''
  private hs = ''
  private lineNo = 0
  private nextLineIdx = 0
  private steps = 0
  private flow: Flow = 'none'
  private substitutedSinceT = false
  private appendQueue: string[] = []
  /**
   * A ranged `c` defers its replacement until the range closes (GNU emits it
   * once per range). Non-ranged `c` emits immediately.
   */
  private pendingChange: { node: Node; text: string } | null = null
  private readonly rangeStates = new Map<Node, RangeState>()
  private readonly labelIndex = new Map<string, number>()
  private readonly regexCache = new Map<string, RegExp>()
  private readonly maxSteps: number

  private psIncomplete = false

  constructor(
    private readonly nodes: Node[],
    private readonly lines: string[],
    private readonly options: { extendedRegex: boolean; quiet: boolean },
    /** Input's final line had no terminating newline (GNU preserves that). */
    private readonly finalLineIncomplete: boolean,
  ) {
    nodes.forEach((node, i) => {
      if (node.cmd.op === 'label') this.labelIndex.set(node.cmd.name, i)
    })
    this.maxSteps = Math.min(
      MAX_EXEC_STEPS,
      Math.max(MIN_EXEC_STEPS, lines.length * countNodes(nodes) * STEPS_PER_LINE_PER_NODE),
    )
  }

  static run(script: string, input: string, options: RunOptions): SedResult {
    let program: Program
    try {
      program = parseProgram(script)
    } catch (error) {
      return toErrorResult(error)
    }

    const extendedRegex = options.extendedRegex === true
    // Like real sed, patterns are compiled up front so malformed ones fail
    // immediately instead of silently matching nothing on line one.
    const validationError = validateRegexes(program.nodes, extendedRegex)
    if (validationError !== null) {
      return { ok: false, error: validationError }
    }

    const engine = new Engine(
      program.nodes,
      splitLines(input),
      {
        extendedRegex,
        quiet: options.quiet === true || program.quietDirective,
      },
      input !== '' && !input.endsWith('\n'),
    )
    try {
      return { ok: true, output: engine.execute() }
    } catch (error) {
      return toErrorResult(error)
    }
  }

  // ---- output helpers -----------------------------------------------------

  /** Emit the pattern space. A final input line that lacked a newline is
   * emitted bare — every time — and later output simply concatenates after
   * it (BSD/GNU model: the missing newline belongs to that line, not to
   * the end of the output stream). */
  private emitPs() {
    this.out.push(this.psIncomplete ? this.ps : `${this.ps}\n`)
  }

  // ---- regex helpers ------------------------------------------------------

  /**
   * `^`/`$` anchor only at pattern-space boundaries by default — that is
   * what GNU/BSD sed do, even when the pattern space contains embedded
   * newlines from N. GNU's `M` flag opts a single pattern into matching at
   * embedded newlines (JS's `m` flag).
   */
  private compile(source: string, ignoreCase: boolean, multiLine = false): RegExp {
    const key = `${this.options.extendedRegex ? 'E' : 'B'}${ignoreCase ? 'i' : ''}${multiLine ? 'm' : ''}:${source}`
    let re = this.regexCache.get(key)
    if (!re) {
      const flags = `g${ignoreCase ? 'i' : ''}${multiLine ? 'm' : ''}`
      re = new RegExp(posixToJs(source, this.options.extendedRegex), flags)
      this.regexCache.set(key, re)
    }
    re.lastIndex = 0
    return re
  }

  // ---- address evaluation -------------------------------------------------

  private evalAddr(addr: Addr): boolean {
    switch (addr.type) {
      case 'line':
        return this.lineNo === addr.line
      case 'last':
        return this.lineNo === this.lines.length
      case 'regex':
        return this.compile(addr.source, addr.ignoreCase, addr.multiLine).test(this.ps)
      case 'step':
        if (addr.start === 0) return this.lineNo % addr.step === 0
        return this.lineNo >= addr.start && (this.lineNo - addr.start) % addr.step === 0
    }
  }

  /**
   * Evaluate a node's addressing for the current pattern space, committing
   * persistent range state unless `dryRun`.
   */
  private testAddressing(node: Node, dryRun = false): boolean {
    if (!node.addr) return true
    const included = this.evalRange(node.addr, node, dryRun)
    return node.negate ? !included : included
  }

  private evalRange(spec: RangeSpec, owner: Node, dryRun: boolean): boolean {
    const stored = this.rangeStates.get(owner)
    const working: RangeState = stored
      ? dryRun
        ? { ...stored }
        : stored
      : { active: false, offsetLeft: 0 }

    let included: boolean

    if (!spec.b) {
      included = this.evalAddr(spec.a)
    } else if (!working.active) {
      // GNU `0` as a range start means "line 1" (only legal as `0,/re/`).
      const opensHere =
        spec.a.type === 'line' && spec.a.line === 0 ? this.lineNo === 1 : this.evalAddr(spec.a)
      if (opensHere) {
        working.active = true
        included = true
        if (spec.a.type === 'line' && spec.a.line === 0 && spec.b.type === 'regex') {
          // GNU `0,/re/`: opens at line 1 with the end regex allowed to
          // match on that same line (unlike ordinary regex-ended ranges).
          if (this.evalAddr(spec.b)) working.active = false
        } else if (spec.b.type === 'offset') {
          working.offsetLeft = spec.b.plus
        } else if (spec.b.type === 'line') {
          // A numeric END at or before the opening line makes a one-line
          // range: `2,2d` deletes exactly line 2, and backwards `3,2d`
          // likewise covers only the line that opened it. (Verified against
          // real sed.) Regex/step/last ends stay deferred to later lines —
          // GNU's `0,/re/` exists precisely because regex ends never match
          // on the opening line.
          const endLine = spec.b.line
          const openedAt = spec.a.type === 'line' ? spec.a.line : this.lineNo
          if (endLine <= openedAt) working.active = false
        }
      } else {
        included = false
      }
    } else {
      if (spec.b.type === 'offset') {
        if (working.offsetLeft > 0) {
          working.offsetLeft--
          included = true
        } else {
          working.active = false
          included = false
        }
      } else {
        included = true
        if (this.evalAddr(spec.b)) {
          working.active = false
        }
      }
    }

    if (!dryRun && !stored) this.rangeStates.set(owner, working)
    return included
  }

  // ---- driver -------------------------------------------------------------

  private execute(): string {
    cycleLoop: while (true) {
      this.resolvePendingChangeBeforeCycle()

      if (this.nextLineIdx >= this.lines.length) break
      this.ps = this.lines[this.nextLineIdx++]
      this.psIncomplete = this.finalLineIncomplete && this.nextLineIdx === this.lines.length
      this.lineNo++
      this.substitutedSinceT = false

      // Run the program; D can force re-runs without reading new input.
      for (;;) {
        this.runList(this.nodes)
        if (this.flow === 'restartWithTrimmedPs') {
          this.appendQueue = []
          this.flow = 'none'
          continue
        }
        break
      }

      switch (this.flow) {
        case 'delete':
          // NOTE: pendingChange survives deliberately — a ranged `c` ends
          // every one of its cycles via d-style flow and must stay queued
          // until its range closes or input runs out.
          this.appendQueue = []
          continue cycleLoop
        case 'stopQuiet':
          this.appendQueue = []
          this.pendingChange = null
          break cycleLoop
        case 'quit':
          if (!this.options.quiet) this.emitPs()
          // Pending `a` text is dropped on q: queue flushes only happen at
          // end-of-cycle during normal flow, and q exits before that point
          // (POSIX specifies a-text is written "before reading the next
          // input line", which never arrives after quit).
          break cycleLoop
        case 'stopNormal':
        case 'none':
          break
      }

      if (!this.options.quiet) this.emitPs()
      this.flushAppendQueue()
    }

    if (this.pendingChange) {
      this.out.push(`${this.pendingChange.text}\n`)
    }
    return this.out.join('')
  }

  /**
   * Called just before a new cycle: if a ranged change is pending, decide
   * whether the upcoming line stays inside its range. If so, keep waiting;
   * otherwise emit the replacement exactly once and clear it.
   */
  private resolvePendingChangeBeforeCycle() {
    const pending = this.pendingChange
    if (!pending) return

    const nextPs = this.nextLineIdx < this.lines.length ? this.lines[this.nextLineIdx] : undefined
    if (nextPs !== undefined) {
      const savedPs = this.ps
      const savedLineNo = this.lineNo
      this.ps = nextPs
      this.lineNo++
      const stillIn = this.testAddressing(pending.node, /* dryRun */ true)
      this.ps = savedPs
      this.lineNo = savedLineNo
      if (stillIn) return
    }
    this.out.push(`${pending.text}\n`)
    this.pendingChange = null
  }

  /**
   * Run a command list. Jumps (b/t) resolve against this list's indices;
   * since all labels are top-level, blocks let signals bubble up to here.
   * Non-jump flows bubble to the cycle driver.
   */
  private runList(list: Node[]) {
    let pc = 0
    while (pc < list.length) {
      this.steps++
      if (this.steps > this.maxSteps) {
        throw new SedSyntaxError(
          'script exceeded the execution limit (possible infinite loop, or input too large for this recipe)',
        )
      }
      const node = list[pc]
      pc++

      this.flow = 'none'
      let jump: JumpSignal | null = null
      if (this.testAddressing(node, false)) {
        try {
          if (node.cmd.op === 'block') this.runBlock(node.cmd.body)
          else this.execCommand(node)
        } catch (error) {
          if (error instanceof JumpSignal) jump = error
          else throw error
        }
      }

      if (jump) {
        if (jump.target === null) return // `b` past the end: end the cycle normally
        pc = jump.target
        continue
      }
      if (this.flow !== 'none') return
    }
  }

  private runBlock(body: Node[]) {
    let i = 0
    while (i < body.length) {
      this.steps++
      if (this.steps > this.maxSteps) {
        throw new SedSyntaxError(
          'script exceeded the execution limit (possible infinite loop, or input too large for this recipe)',
        )
      }
      const node = body[i]
      i++
      if (!this.testAddressing(node, false)) continue
      this.flow = 'none'
      if (node.cmd.op === 'block') this.runBlock(node.cmd.body)
      else this.execCommand(node)
      if (this.flow !== 'none') return
    }
  }

  private flushAppendQueue() {
    this.out.push(...this.appendQueue.map((t) => `${t}\n`))
    this.appendQueue = []
  }

  // ---- individual commands --------------------------------------------------

  private execCommand(node: Node) {
    const cmd = node.cmd
    switch (cmd.op) {
      case 'p':
        this.emitPs()
        break
      case 'P': {
        const nl = this.ps.indexOf('\n')
        if (nl === -1) this.emitPs()
        else this.out.push(`${this.ps.slice(0, nl)}\n`)
        break
      }
      case 'd':
        this.flow = 'delete'
        break
      case 'D': {
        const nl = this.ps.indexOf('\n')
        if (nl === -1 || nl === this.ps.length - 1) {
          // Nothing beyond the first newline: behave like d.
          this.flow = 'delete'
        } else {
          this.ps = this.ps.slice(nl + 1)
          this.psIncomplete = false
          this.appendQueue = []
          this.flow = 'restartWithTrimmedPs'
        }
        break
      }
      case 'n':
        if (!this.options.quiet) this.emitPs()
        this.flushAppendQueue()
        if (this.nextLineIdx >= this.lines.length) {
          this.flow = 'stopQuiet'
        } else {
          this.ps = this.lines[this.nextLineIdx++]
          this.psIncomplete = this.finalLineIncomplete && this.nextLineIdx === this.lines.length
          this.lineNo++
          this.substitutedSinceT = false
        }
        break
      case 'N':
        if (this.nextLineIdx >= this.lines.length) {
          this.flow = 'stopNormal'
        } else {
          this.ps += `\n${this.lines[this.nextLineIdx++]}`
          this.lineNo++
          this.psIncomplete = false
          // Reading input via N resets the t-flag too (POSIX: "since the
          // last input line was read or conditional branch was taken").
          this.substitutedSinceT = false
        }
        break
      case 'h':
        this.hs = this.ps
        break
      case 'H':
        this.hs += `\n${this.ps}`
        this.psIncomplete = false
        break
      case 'g':
        this.ps = this.hs
        break
      case 'G':
        this.ps += `\n${this.hs}`
        this.psIncomplete = false
        break
      case 'x': {
        const tmp = this.hs
        this.hs = this.ps
        this.ps = tmp
        this.psIncomplete = false
        break
      }
      case 'y':
        this.transliterate(cmd.from, cmd.to)
        break
      case 's':
        this.substitute(cmd)
        break
      case 'append':
        this.appendQueue.push(cmd.text)
        break
      case 'insert':
        this.out.push(`${cmd.text}\n`)
        break
      case 'change':
        this.flow = 'delete'
        if (node.addr?.b) this.pendingChange = { node, text: cmd.text }
        else this.out.push(`${cmd.text}\n`)
        break
      case 'equal':
        this.out.push(`${this.lineNo}\n`)
        break
      case 'quit':
        this.flow = 'quit'
        break
      case 'label':
        break
      case 'branch':
        this.branchTo(cmd.label)
        break
      case 'tbranch':
        if (this.substitutedSinceT) {
          this.substitutedSinceT = false
          this.branchTo(cmd.label)
        }
        break
    }
  }

  private branchTo(label: string | null): never {
    const target = label === null ? null : this.labelIndex.get(label)
    throw new JumpSignal(target ?? null)
  }

  private transliterate(from: string, to: string) {
    let result = ''
    for (let i = 0; i < this.ps.length; i++) {
      const ch = this.ps[i]
      const j = from.indexOf(ch)
      result += j >= 0 && j < to.length ? to[j] : ch
    }
    this.ps = result
  }

  private substitute(cmd: Extract<Cmd, { op: 's' }>) {
    const re = this.compile(cmd.source, cmd.ignoreCase, cmd.multiLine)
    const src = this.ps

    let pass = 0
    let replaced = 0
    let consumedUpTo = 0
    let result = ''

    re.lastIndex = 0
    for (;;) {
      const m = re.exec(src)
      if (!m) break
      pass++
      // nth alone replaces exactly that occurrence; nth+g replaces that
      // occurrence and every one after (GNU 3g semantics); global every;
      // otherwise the first.
      const shouldReplace =
        cmd.nth !== null
          ? cmd.global
            ? pass >= cmd.nth
            : pass === cmd.nth
          : cmd.global || pass === 1
      if (shouldReplace) {
        result +=
          src.slice(consumedUpTo, m.index) +
          this.expandReplacement(cmd.replacement, m[0], m.slice(1))
        replaced++
        consumedUpTo = m.index + m[0].length
      }
      if (m.index === re.lastIndex) re.lastIndex++ // zero-length safety net
    }
    result += src.slice(consumedUpTo)

    if (replaced > 0) {
      this.ps = result
      this.substitutedSinceT = true
      if (cmd.printMatch) this.emitPs()
    }
  }

  /**
   * Materialize the RHS of s///: literal runs, &, \1-\9, and GNU case ops
   * (\U\L\u\l\E). One-shot \u/\l affect the first character of what follows;
   * persistent \U/\L stay on until \E.
   */
  private expandReplacement(
    parts: Extract<Cmd, { op: 's' }>['replacement'],
    fullMatch: string,
    groups: string[],
  ): string {
    let out = ''
    let baseMode: 'U' | 'L' | null = null
    let oneShot: 'u' | 'l' | null = null

    const applyCase = (text: string): string => {
      let t = text
      // Persistent \U/\L apply to the whole chunk first; a one-shot \u/\l
      // then re-modifies the resulting first character — so `s/.*/\L\u&/`
      // title-cases ("Hello world"), matching GNU's positional composition.
      if (baseMode === 'U') t = t.toUpperCase()
      else if (baseMode === 'L') t = t.toLowerCase()
      if (oneShot === 'u') t = capFirst(t)
      else if (oneShot === 'l') t = lowerFirst(t)
      oneShot = null
      return t
    }

    for (const part of parts) {
      switch (part.type) {
        case 'text':
          out += applyCase(part.value)
          break
        case 'amp':
          out += applyCase(fullMatch)
          break
        case 'group':
          // \0 is the whole match, like GNU sed.
          out += applyCase(part.n === 0 ? fullMatch : (groups[part.n - 1] ?? ''))
          break
        case 'case':
          if (part.mode === 'E') baseMode = null
          else if (part.mode === 'U' || part.mode === 'L') baseMode = part.mode
          else oneShot = part.mode
          break
      }
    }
    return out
  }
}

function countNodes(nodes: Node[]): number {
  let n = 0
  const visit = (list: Node[]) => {
    for (const node of list) {
      n++
      if (node.cmd.op === 'block') visit(node.cmd.body)
    }
  }
  visit(nodes)
  return n
}

function capFirst(t: string): string {
  return t === '' ? t : t.charAt(0).toUpperCase() + t.slice(1)
}

/** Compile every regex in the program (s patterns + /addr/) up front. */
function validateRegexes(nodes: Node[], extended: boolean): string | null {
  let problem: string | null = null

  const checkPattern = (source: string, ignoreCase: boolean, multiLine: boolean) => {
    if (problem !== null) return
    try {
      new RegExp(posixToJs(source, extended), `g${ignoreCase ? 'i' : ''}${multiLine ? 'm' : ''}`)
    } catch (error) {
      const message =
        error instanceof SyntaxError
          ? error.message.replace(/^Invalid regular expression:? ?/, '')
          : String(error)
      problem = `invalid regular expression: ${message}`
    }
  }

  const visit = (list: Node[]) => {
    for (const node of list) {
      if (problem !== null) return
      if (node.addr) {
        if (node.addr.a.type === 'regex') {
          checkPattern(node.addr.a.source, node.addr.a.ignoreCase, node.addr.a.multiLine)
        }
        if (node.addr.b && node.addr.b.type === 'regex') {
          checkPattern(node.addr.b.source, node.addr.b.ignoreCase, node.addr.b.multiLine)
        }
      }
      if (node.cmd.op === 's') {
        checkPattern(node.cmd.source, node.cmd.ignoreCase, node.cmd.multiLine)
      }
      if (node.cmd.op === 'block') visit(node.cmd.body)
    }
  }
  visit(nodes)
  return problem
}

function lowerFirst(t: string): string {
  return t === '' ? t : t.charAt(0).toLowerCase() + t.slice(1)
}

function toErrorResult(error: unknown): SedResult {
  if (error instanceof SedSyntaxError) {
    return { ok: false, error: error.message }
  }
  if (error instanceof SyntaxError) {
    // JS RegExp compile failures land here.
    const message = error.message.replace(/^Invalid regular expression:? ?/, '')
    return { ok: false, error: `invalid regular expression: ${message}` }
  }
  if (error instanceof Error) {
    return { ok: false, error: error.message }
  }
  return { ok: false, error: String(error) }
}

function splitLines(input: string): string[] {
  if (input === '') return []
  const lines = input.split('\n')
  if (input.endsWith('\n')) lines.pop()
  return lines
}

/**
 * Public entry point for the playground and cheatsheet previews.
 */
export function runSed(script: string, input: string, options: RunOptions = {}): SedResult {
  return Engine.run(script, input, options)
}
