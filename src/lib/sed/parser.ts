/**
 * Parser for a practical subset of the sed scripting language.
 *
 * Supported commands:
 *   s  y  p  P  d  D  n  N  h  H  g  G  x  q  =  a  i  c
 *   { blocks }  :labels  b  t
 *
 * Supported addressing: line numbers, $, /re/ (with I flag), custom
 * delimiters (\cREc), comma ranges, GNU offsets (addr,+N) and steps
 * (first~step), all combinable with !.
 *
 * Labels and branches operate at the top level of the script, which covers
 * every common one-liner idiom (:a;N;$!ba and friends).
 */

export type Addr =
  | { type: 'line'; line: number }
  | { type: 'last' }
  | { type: 'regex'; source: string; ignoreCase: boolean }
  | { type: 'step'; start: number; step: number }

/** Second half of a range: another address, or a GNU "+N line offset". */
export type RangeEnd = Addr | { type: 'offset'; plus: number }

export interface RangeSpec {
  a: Addr
  b: RangeEnd | null
}

export type ReplPart =
  | { type: 'text'; value: string }
  | { type: 'amp' }
  | { type: 'group'; n: number }
  | { type: 'case'; mode: 'U' | 'L' | 'u' | 'l' | 'E' }

export type Cmd =
  | {
      op: 's'
      source: string
      ignoreCase: boolean
      replacement: ReplPart[]
      global: boolean
      printMatch: boolean
      nth: number | null
    }
  | { op: 'y'; from: string; to: string }
  | { op: 'append' | 'insert' | 'change'; text: string }
  | { op: 'p' | 'P' | 'd' | 'D' | 'n' | 'N' | 'h' | 'H' | 'g' | 'G' | 'x' | 'equal' }
  | { op: 'quit' }
  | { op: 'label'; name: string }
  | { op: 'branch'; label: string | null }
  | { op: 'tbranch'; label: string | null }
  | { op: 'block'; body: Node[] }

export interface Node {
  addr: RangeSpec | null
  negate: boolean
  cmd: Cmd
}

export interface Program {
  nodes: Node[]
  /** Whether the script began with `#n` (suppresses auto-print). */
  quietDirective: boolean
}

export class SedSyntaxError extends Error {}

const TERMINATOR_RE = /[;\s]/

class Parser {
  private pos = 0
  private quietDirective = false

  constructor(private readonly src: string) {}

  parse(): Program {
    const nodes: Node[] = []
    // `#n` as the very first thing in a script means "suppress auto-print"
    // (same as the -n flag). skipSeparators treats other comments as noise,
    // so intercept this before the general loop sees it.
    const directive = /^[\s]*#n(?=[;\s])/.exec(this.src)
    if (directive) {
      this.quietDirective = true
      this.pos = directive[0].length
    }
    for (;;) {
      this.skipSeparators()
      if (this.eof()) break
      if (this.peek() === '}') break
      nodes.push(this.parseNode())
    }

    const rest = this.src.slice(this.pos)
    if (/^[;\s]*}/.test(rest)) {
      this.fail("unexpected `}'")
    }
    return { nodes, quietDirective: this.quietDirective }
  }

  private eof(): boolean {
    return this.pos >= this.src.length
  }

  private peek(offset = 0): string | undefined {
    return this.src[this.pos + offset]
  }

  private fail(message: string): never {
    throw new SedSyntaxError(message)
  }

  private skipSeparators() {
    for (;;) {
      while (!this.eof() && (this.peek() === ' ' || this.peek() === '\t')) this.pos++
      const ch = this.peek()
      if (ch === ';' || ch === '\n') {
        this.pos++
        continue
      }
      if (ch === '#') {
        this.skipComment()
        continue
      }
      return
    }
  }

  private skipComment() {
    const nl = this.src.indexOf('\n', this.pos)
    this.pos = nl === -1 ? this.src.length : nl + 1
  }

  private parseNode(): Node {
    const addr = this.parseRange()

    let negate = false
    const save = this.pos
    this.skipSpaces()
    if (this.peek() === '!') {
      negate = true
      this.pos++
    } else {
      this.pos = save
    }

    this.skipSpaces()
    const ch = this.peek()
    if (ch === undefined) {
      if (negate) this.fail("expected command after `!'")
      this.fail('missing command')
    }

    if (ch === '{') {
      this.pos++
      const body: Node[] = []
      for (;;) {
        this.skipSeparators()
        if (this.eof()) this.fail("unexpected end of script: expecting `}'")
        const bodyCh = this.peek()
        if (bodyCh === '}') {
          this.pos++
          break
        }
        body.push(this.parseNode())
      }
      return { addr, negate, cmd: { op: 'block', body } }
    }

    this.pos++ // consume the command letter
    return { addr, negate, cmd: this.parseSimpleCommand(ch) }
  }

  private skipSpaces() {
    while (!this.eof() && (this.peek() === ' ' || this.peek() === '\t')) this.pos++
  }

  private parseRange(): RangeSpec | null {
    const a = this.parseAddr()
    if (!a) return null
    this.skipSpaces()
    if (this.peek() !== ',') return { a, b: null }
    this.pos++
    this.skipSpaces()
    if (this.peek() === '+') {
      this.pos++
      const plus = this.readNumber()
      if (plus === null) this.fail("expected line count after `,+'")
      return { a, b: { type: 'offset', plus } }
    }
    const b = this.parseAddr()
    if (!b) this.fail("expected address after `,'")
    return { a, b }
  }

  private parseAddr(): Addr | null {
    const ch = this.peek()
    if (ch === undefined) return null

    if (ch === '$') {
      this.pos++
      return { type: 'last' }
    }

    if (ch === '/' || ch === '\\') {
      let delim = '/'
      if (ch === '\\') {
        const marker = this.peek(1)
        if (marker === undefined || marker === '\n' || marker === '\\') {
          this.fail("expected a delimiter character after `\\'")
        }
        delim = marker
        this.pos++
      }
      this.pos++ // step past the opening delimiter
      const source = this.scanRegexBody(delim)
      let ignoreCase = false
      while (this.peek() === 'I' || this.peek() === 'M') {
        if (this.peek() === 'I') ignoreCase = true
        this.pos++
      }
      return { type: 'regex', source, ignoreCase }
    }

    const n = this.readNumber()
    if (n === null) return null
    if (this.peek() === '~') {
      this.pos++
      const step = this.readNumber()
      if (step === null || step < 1) this.fail('expected positive number after `~`')
      return { type: 'step', start: n, step }
    }
    return { type: 'line', line: n }
  }

  private readNumber(): number | null {
    const m = /^\d+/.exec(this.src.slice(this.pos))
    if (!m) return null
    this.pos += m[0].length
    return Number.parseInt(m[0], 10)
  }

  /**
   * Scan a `/regex/` body bounded by `delim`.
   *
   * A `\delim` sequence means a literal delimiter, re-emitted as a
   * single-character class like `[|]` so the flavor translator can't mistake
   * it for an operator.
   */
  private scanRegexBody(delim: string): string {
    let out = ''
    for (;;) {
      const ch = this.peek()
      if (ch === undefined || ch === '\n') {
        this.fail(`unterminated regular expression`)
      }
      if (ch === '\\') {
        const next = this.peek(1)
        if (next === undefined) this.fail('unexpected end of regular expression')
        if (next === delim) {
          out += `[${escapeClassChar(delim)}]`
        } else if (next === '\\') {
          out += '\\\\'
        } else {
          out += `\\${next}`
        }
        this.pos += 2
        continue
      }
      if (ch === delim) {
        this.pos++
        return out
      }
      out += ch
      this.pos++
    }
  }

  /** Scan a delimited region keeping escape sequences verbatim. */
  private scanRawBody(delim: string): string {
    let out = ''
    for (;;) {
      const ch = this.peek()
      if (ch === undefined || ch === '\n') {
        this.fail(`unterminated \`${delim}' expression`)
      }
      if (ch === '\\') {
        const next = this.peek(1)
        if (next === undefined) this.fail(`unterminated \`${delim}' expression`)
        out += `\\${next}`
        this.pos += 2
        continue
      }
      if (ch === delim) {
        this.pos++
        return out
      }
      out += ch
      this.pos++
    }
  }

  private parseS(): Cmd {
    const delim = this.peek()
    if (delim === undefined || delim === '\\' || delim === '\n' || /\s/.test(delim)) {
      this.fail("missing delimiter for `s' command")
    }
    this.pos++
    const source = this.scanRegexBody(delim)
    const rawRepl = this.scanRawBody(delim)

    let global = false
    let printMatch = false
    let ignoreCase = false
    let nth: number | null = null
    for (;;) {
      const f = this.peek()
      if (f === undefined || f === ';' || f === '\n' || f === '}') break
      if (f === ' ' || f === '\t') {
        // sed tolerates whitespace between modifiers: `s/a/b/ g p`
        this.pos++
        continue
      }
      if (f === 'g') {
        if (global) this.fail("multiple `g' options to `s' command")
        global = true
      } else if (f === 'p') {
        printMatch = true
      } else if (f === 'i' || f === 'I') {
        ignoreCase = true
      } else if (f === 'm' || f === 'M') {
        // Anchor-per-line behavior is always-on in this playground.
      } else if (/\d/.test(f)) {
        if (nth !== null) this.fail("number option to `s' command may only be specified once")
        // gN / Ng are both legal GNU orderings: "replace from Nth onward".
        nth = this.readNumber()
        continue
      } else if ('wWeErE'.includes(f)) {
        this.fail(`the \`${f}' option to \`s' is not supported in this playground`)
      } else {
        this.fail(`unknown option to \`s'`)
      }
      this.pos++
    }
    if (nth !== null && nth < 1) this.fail("number option to `s' command may only be nonzero")

    return {
      op: 's',
      source,
      ignoreCase,
      replacement: this.parseReplacement(rawRepl),
      global,
      printMatch,
      nth,
    }
  }

  private parseY(): Cmd {
    const delim = this.peek()
    if (delim === undefined || delim === '\\' || delim === '\n' || /\s/.test(delim)) {
      this.fail("missing delimiter for `y' command")
    }
    this.pos++
    const decodeText = (raw: string) =>
      raw.replace(/\\(.)/g, (_all, c: string) => ({ n: '\n', t: '\t', r: '\r' })[c] ?? c)
    const from = decodeText(this.scanRawBody(delim))
    const to = decodeText(this.scanRawBody(delim))
    if (from.length !== to.length) {
      this.fail("strings for `y' command are different lengths")
    }
    return { op: 'y', from, to }
  }

  /** Replacement-text grammar: & , \0-\9 , \n\t\r , GNU case ops \U\L\u\l\E . */
  private parseReplacement(raw: string): ReplPart[] {
    const parts: ReplPart[] = []
    let literal = ''
    const flush = () => {
      if (literal) parts.push({ type: 'text', value: literal })
      literal = ''
    }
    for (let i = 0; i < raw.length; i++) {
      const ch = raw[i]
      if (ch === '\\' && i + 1 < raw.length) {
        const esc = raw[i + 1]
        i++
        switch (esc) {
          case '&':
            literal += '&'
            break
          case '\\':
            literal += '\\'
            break
          case '0':
          case '1':
          case '2':
          case '3':
          case '4':
          case '5':
          case '6':
          case '7':
          case '8':
          case '9':
            flush()
            parts.push({ type: 'group', n: Number(esc) })
            break
          case 'n':
            literal += '\n'
            break
          case 't':
            literal += '\t'
            break
          case 'r':
            literal += '\r'
            break
          case 'U':
          case 'L':
          case 'u':
          case 'l':
          case 'E':
            flush()
            parts.push({ type: 'case', mode: esc })
            break
          default:
            literal += `\\${esc}`
        }
      } else if (ch === '&') {
        flush()
        parts.push({ type: 'amp' })
      } else {
        literal += ch
      }
    }
    flush()
    return parts
  }

  private parseTextArg(kind: 'a' | 'i' | 'c'): Cmd {
    let text = ''
    if (this.peek() === '\\' && this.peek(1) === '\n') {
      // Classic two-line form: `i\` newline text-line.
      this.pos += 2
      const nl = this.src.indexOf('\n', this.pos)
      text = nl === -1 ? this.src.slice(this.pos) : this.src.slice(this.pos, nl)
      this.pos = nl === -1 ? this.src.length : nl
    } else {
      // Same-line forms: `a text` (GNU), and `a\ text` where a backslash
      // precedes the text. Both take the rest of the line as the argument;
      // an unescaped `;` still ends the command, matching GNU.
      if (this.peek() === '\\') {
        this.pos++
        if (this.peek() === undefined) this.fail(`expected \\ after \`${kind}'`)
      }
      if (this.peek() === ' ') this.pos++
      for (;;) {
        const ch = this.peek()
        if (ch === undefined || ch === '\n') break
        if (ch === ';') {
          this.pos++
          break
        }
        if (ch === '\\' && this.peek(1) === ';') {
          text += ';'
          this.pos += 2
          continue
        }
        text += ch
        this.pos++
      }
    }
    const op = kind === 'a' ? 'append' : kind === 'i' ? 'insert' : 'change'
    return { op, text } as Cmd
  }

  private parseBranch(command: ':' | 'b' | 't'): Cmd {
    this.skipSpaces()
    let name = ''
    while (!this.eof()) {
      const ch = this.peek()
      if (ch === undefined || TERMINATOR_RE.test(ch)) break
      name += ch
      this.pos++
    }
    if (command === ':') {
      if (!name) this.fail(': expects a label name')
      return { op: 'label', name }
    }
    return command === 'b'
      ? { op: 'branch', label: name || null }
      : { op: 'tbranch', label: name || null }
  }

  private parseSimpleCommand(ch: string): Cmd {
    switch (ch) {
      case 's':
        return this.parseS()
      case 'y':
        return this.parseY()
      case 'a':
      case 'i':
      case 'c':
        return this.parseTextArg(ch)
      case 'p':
        return { op: 'p' }
      case 'P':
        return { op: 'P' }
      case 'd':
        return { op: 'd' }
      case 'D':
        return { op: 'D' }
      case 'n':
        return { op: 'n' }
      case 'N':
        return { op: 'N' }
      case 'h':
        return { op: 'h' }
      case 'H':
        return { op: 'H' }
      case 'g':
        return { op: 'g' }
      case 'G':
        return { op: 'G' }
      case 'x':
        return { op: 'x' }
      case 'q':
        return { op: 'quit' }
      case '=':
        return { op: 'equal' }
      case ':':
      case 'b':
      case 't':
        return this.parseBranch(ch)
      case 'F':
      case 'l':
      case 'L':
      case 'z':
      case 'v':
      case 'w':
      case 'W':
      case 'r':
      case 'R':
      case 'e':
      case 'T':
      case 'Q':
        return this.fail(`the \`${ch}' command is not supported in this playground`)
      case '}':
        return this.fail("unexpected `}'")
      default:
        return this.fail(`unknown command: \`${ch}'`)
    }
  }
}

function escapeClassChar(ch: string): string {
  return '\\^[]'.includes(ch) ? `\\${ch}` : ch
}

/**
 * Parse a script. Top-level labels feed branch validation; branches may only
 * target top-level labels (the shape used by all common sed idioms).
 */
export function parseProgram(script: string): Program {
  const program = new Parser(script).parse()

  const labels = new Map<string, boolean>()
  for (const node of program.nodes) {
    if (node.cmd.op === 'label') {
      if (labels.has(node.cmd.name)) {
        throw new SedSyntaxError(`duplicate label \`${node.cmd.name}'`)
      }
      labels.set(node.cmd.name, true)
    }
  }
  const checkBranches = (nodes: Node[]) => {
    for (const node of nodes) {
      const { cmd } = node
      if (
        (cmd.op === 'branch' || cmd.op === 'tbranch') &&
        cmd.label !== null &&
        !labels.has(cmd.label)
      ) {
        throw new SedSyntaxError(`can't find label for jump to \`${cmd.label}'`)
      }
      if (cmd.op === 'block') checkBranches(cmd.body)
    }
  }
  checkBranches(program.nodes)

  return program
}
