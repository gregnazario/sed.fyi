/**
 * Translate a POSIX regular expression (BRE or ERE flavor) into a JavaScript
 * RegExp-compatible source string.
 *
 * Key differences handled here:
 * - BRE: grouping/backrefs/bounds/alternation use escaped forms
 *   (\(...\), \1-\9, \{n,m\}, \|, \+, \?) while JS uses bare metacharacters,
 *   and vice versa for unescaped characters.
 * - POSIX bracket expressions like [[:alpha:]] don't exist in JS.
 * - GNU word boundaries \< and \> map to \b.
 */

const POSIX_CLASSES: Record<string, string> = {
  alpha: 'A-Za-z',
  digit: '0-9',
  alnum: 'A-Za-z0-9',
  upper: 'A-Z',
  lower: 'a-z',
  space: '\\s\\v\\f',
  blank: ' \\t',
  cntrl: '\\x00-\\x1f\\x7f',
  xdigit: '0-9A-Fa-f',
  punct: '!-/:-@\\[-`{-~',
  graph: '\\x21-\\x7e',
  print: '\\x20-\\x7e',
}

/** Characters that are plain literals in a POSIX class but mean something in JS. */
function escapeClassChar(ch: string): string {
  return '\\^[]'.includes(ch) ? `\\${ch}` : ch
}

class Translator {
  private out = ''
  constructor(
    private readonly src: string,
    private readonly extended: boolean,
  ) {}

  translate(): string {
    let i = 0
    while (i < this.src.length) {
      const ch = this.src[i]
      if (ch === '[') {
        i = this.translateClass(i)
      } else if (ch === '\\') {
        i = this.translateEscape(i)
      } else {
        this.out += this.plainChar(ch)
        i++
      }
    }
    return this.out
  }

  /** Unescaped metacharacters: same meaning in both flavors, but literals in JS. */
  private plainChar(ch: string): string {
    if (!this.extended && '(){}+?|'.includes(ch)) {
      // Literal in BRE, operator in JS -> escape it for JS.
      return `\\${ch}`
    }
    // Everything else ('.', '*', '^', '$' and plain text) passes through as-is;
    // ERE operators '(' ')' '|' '+' '?' '{' '}' are already operators in JS.
    return ch
  }

  private translateEscape(i: number): number {
    const next = this.src[i + 1]
    if (next === undefined) {
      // Trailing backslash: sed errors on this at parse time; be forgiving here.
      this.out += '\\\\'
      return i + 1
    }
    switch (next) {
      case '<':
      case '>':
        // GNU word boundary
        this.out += '\\b'
        return i + 2
      case '(':
      case ')':
      case '{':
      case '}':
      case '+':
      case '?':
      case '|':
        // Escaped operator: significant in BRE, literal in ERE.
        if (this.extended) {
          this.out += `\\${next}`
        } else {
          this.out += next
        }
        return i + 2
      case 'n':
        this.out += '\\n'
        return i + 2
      case 't':
        this.out += '\\t'
        return i + 2
      case 'r':
        this.out += '\\r'
        return i + 2
      case 'f':
        this.out += '\\f'
        return i + 2
      case 'v':
        this.out += '\\v'
        return i + 2
      case 'e':
        this.out += '\\x1b'
        return i + 2
      case 'c':
        if (!this.extended || !'(){}+?|.[]*^$'.includes(this.src[i + 2] ?? '')) {
          // \c where c is not a metacharacter: keep for JS (e.g. \d, \w, \1)
          this.out += `\\${next}`
          return i + 2
        }
        this.out += `\\\\${this.src[i + 2]}`
        return i + 3
      default:
        // Identity escape: pass through unchanged (JS accepts \X for punctuation X).
        this.out += `\\${next}`
        return i + 2
    }
  }

  /** Handle "[...", including [[:name:]] expansions. Returns new index. */
  private translateClass(start: number): number {
    let i = start + 1
    let content = ''
    let negated = false

    if (this.src[i] === '^') {
      negated = true
      i++
    }
    // A ']' immediately after '[' or '[^' is a literal.
    if (this.src[i] === ']') {
      content += '\\]'
      i++
    }

    while (i < this.src.length && this.src[i] !== ']') {
      if (this.src.startsWith('[:', i)) {
        const close = this.src.indexOf(':]', i + 2)
        if (close === -1) break
        const name = this.src.slice(i + 2, close)
        const expansion = POSIX_CLASSES[name]
        if (expansion === undefined) {
          throw new Error(`unsupported character class [[:${name}:]]`)
        }
        content += expansion
        i = close + 2
      } else if (this.src[i] === '\\' && i + 1 < this.src.length) {
        const esc = this.src[i + 1]
        if ('ntrfve'.includes(esc)) {
          content += { n: '\\n', t: '\\t', r: '\\r', f: '\\f', v: '\\v', e: '\\x1b' }[esc]
        } else {
          content += escapeClassChar(esc)
        }
        i += 2
      } else {
        content += escapeClassChar(this.src[i])
        i++
      }
    }
    if (i >= this.src.length) {
      throw new Error('unterminated bracket expression `[...]`')
    }
    this.out += `[${negated ? '^' : ''}${content}]`
    return i + 1
  }
}

export function posixToJs(source: string, extended: boolean): string {
  return new Translator(source, extended).translate()
}
