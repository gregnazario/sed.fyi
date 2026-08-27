import { describe, expect, test } from 'bun:test'
import { runSed } from './index'

const ok = (script: string, input: string, opts?: { extendedRegex?: boolean; quiet?: boolean }) => {
  const result = runSed(script, input, opts)
  if (!result.ok) throw new Error(`expected success for ${JSON.stringify(script)}: ${result.error}`)
  return result.output
}

const err = (script: string, input = '') => {
  const result = runSed(script, input)
  expect(result.ok).toBe(false)
  if (result.ok) throw new Error('expected failure')
  return result.error
}

describe('substitution', () => {
  test('first occurrence per line by default', () => {
    expect(ok('s/a/X/', 'aaa\naa')).toBe('Xaa\nXa\n')
  })

  test('g flag replaces every occurrence', () => {
    expect(ok('s/a/X/g', 'banana')).toBe('bXnXnX\n')
  })

  test('nth flag replaces only that occurrence', () => {
    expect(ok('s/a/-/2', 'aaa\naa\n')).toBe('a-a\na-\n')
    expect(ok('s/a/-/3g', 'aaaa')).toBe('aa--\n')
  })

  test('case-insensitive I flag', () => {
    expect(ok('s/hello/bye/gI', 'Hello HELLO hello')).toBe('bye bye bye\n')
  })

  test('& and backreferences', () => {
    expect(ok('s/[0-9][0-9]*/<&>/g', 'ab12cd345')).toBe('ab<12>cd<345>\n')
    expect(ok('s/\\(.*\\):\\(.*\\)/\\2:\\1/', 'left:right')).toBe('right:left\n')
  })

  test('GNU case conversion ops', () => {
    expect(ok('s/.*/\\U&/', 'shout')).toBe('SHOUT\n')
    expect(ok('s/.*/\\L&/', 'QUIET')).toBe('quiet\n')
    expect(ok('s/o/\\u&/g', 'foo boo')).toBe('fOO bOO\n')
    expect(ok('s/\\(a\\)\\(bc\\)/\\U\\2\\E-\\1/', 'abc')).toBe('BC-a\n')
  })

  test('literal & needs escaping', () => {
    expect(ok('s/b/&y&/', 'cat black cat')).toBe('cat byblack cat\n')
    expect(ok('s/x/a\\&b/', 'xxx')).toBe('a&bxx\n')
  })

  test('alternative delimiters, including escaped ones', () => {
    expect(ok('s|/usr/local|/opt|', '/usr/local/bin')).toBe('/opt/bin\n')
    expect(ok('s,a,b,', 'aaa')).toBe('baa\n')
    expect(ok('s/a\\/b/c/', 'x a/b y')).toBe('x c y\n')
    expect(ok('s%a\\%b%Z%', 'a%b')).toBe('Z\n')
  })

  test('empty replacement deletes matches', () => {
    expect(ok('s/[aeiou]//g', 'beautiful')).toBe('btfl\n')
  })
})

describe('regex flavors', () => {
  test('BRE: escaped groups and alternation extension', () => {
    expect(ok('s/\\(cat\\|dog\\)/PET/g', 'cat dog bird')).toBe('PET PET bird\n')
  })

  test('ERE with -E: bare operators', () => {
    expect(ok('s/(cat|dog)/PET/g', 'cat dog', { extendedRegex: true })).toBe('PET PET\n')
    expect(ok('s/o+/?/g', 'foood', { extendedRegex: true })).toBe('f?d\n')
  })

  test('ERE treats escaped parens as literals', () => {
    expect(ok('s#foo\\(bar#BANG#', 'foo(bar', { extendedRegex: true })).toBe('BANG\n')
  })

  test('POSIX character classes', () => {
    expect(ok('s/[[:digit:]]/#/g', 'a1b22c')).toBe('a#b##c\n')
    expect(ok('s/[^[:alpha:]]//g', 'ab12!cd')).toBe('abcd\n')
  })

  test('GNU word boundaries map to JS \\b', () => {
    // Not in the differential set (BSD lacks \b) but behavior is pinned here.
    expect(ok('s/\\bcat\\b/PET/g', 'concat cat')).toBe('concat PET\n')
  })

  test('bad regex produces an error, not a crash', () => {
    expect(err('s/[a-/x/', '')).toContain('invalid regular expression')
  })
})

describe('deletion and printing', () => {
  const input = 'one\ntwo\nthree\nfour\n'

  test('/re/d deletes matching lines', () => {
    expect(ok('/o/d', input)).toBe('three\n')
  })

  test('! negation', () => {
    expect(ok('/two/!d', input)).toBe('two\n')
  })

  test('-n + p prints only selected lines', () => {
    expect(ok('/e/p', input, { quiet: true })).toBe('one\nthree\n')
  })

  test('= prints line numbers', () => {
    expect(ok('$=', input, { quiet: true })).toBe('4\n')
  })

  test('ranges delete/print inclusive spans', () => {
    expect(ok('2,3d', input)).toBe('one\nfour\n')
    expect(ok('2,3p', input, { quiet: true })).toBe('two\nthree\n')
  })

  test('line-number and last-line addresses', () => {
    expect(ok('$d', input)).toBe('one\ntwo\nthree\n')
    expect(ok('1d', input)).toBe('two\nthree\nfour\n')
  })

  test('step addresses (GNU first~step)', () => {
    expect(ok('0~2p', input, { quiet: true })).toBe('two\nfour\n')
    expect(ok('1~2p', input, { quiet: true })).toBe('one\nthree\n')
    expect(ok('2~2p', input, { quiet: true })).toBe('two\nfour\n')
  })

  test('GNU offset ranges addr,+N', () => {
    expect(ok('2,+1d', input)).toBe('one\nfour\n')
  })
})

describe('transliteration', () => {
  test('y swaps characters one-for-one', () => {
    expect(ok('y/abc/xyz/', 'cab')).toBe('zxy\n')
  })

  test('length mismatch errors', () => {
    expect(err('y/ab/xyz/', 'a')).toBe("strings for `y' command are different lengths")
  })
})

describe('text insertion commands', () => {
  const input = 'a\nb\nc\n'

  test('GNU one-liner forms', () => {
    expect(ok('1i HEADER', input)).toBe('HEADER\na\nb\nc\n')
    expect(ok('/b/a FOOTER', input)).toBe('a\nb\nFOOTER\nc\n')
    expect(ok('/b/c REPLACED', input)).toBe('a\nREPLACED\nc\n')
  })

  test('classic two-line form after the backslash', () => {
    expect(ok('1i\\\nHEADER', 'start')).toBe('HEADER\nstart\n')
  })

  test('ranged change emits once', () => {
    expect(ok('1,3c NEW BLOCK', input)).toBe('NEW BLOCK\n')
  })

  test('append queues even under -n', () => {
    expect(ok('/b/a X', input, { quiet: true })).toBe('X\n')
  })
})

describe('hold space', () => {
  test('G double-spaces', () => {
    expect(ok('G', 'a\nb')).toBe('a\n\nb\n\n')
  })

  test('reverse every line: 1!G;h;$!d', () => {
    expect(ok('1!G;h;$!d', '1\n2\n3\n')).toBe('3\n2\n1\n')
  })

  test('x swaps pattern and hold space', () => {
    expect(ok('/keep/h;$!d;x', 'keep\ndrop\n')).toBe('keep\n')
  })
})

describe('multiline and flow control', () => {
  test('N joins line pairs', () => {
    expect(ok('N;s/\\n/ /', 'a\nb\nc\nd\n')).toBe('a b\nc d\n')
  })

  test('label loop joins all lines', () => {
    expect(ok(':a;N;$!ba;s/\\n/,/g', 'a\nb\nc\n')).toBe('a,b,c\n')
  })

  test('every-other-line via n;d', () => {
    expect(ok('n;d', '1\n2\n3\n4\n')).toBe('1\n3\n')
  })

  test('adjacent-duplicate squeeze', () => {
    const out = ok('$!N;/^\\(.*\\)\\n\\1$/!P;D', 'a\na\nb\nb\nb\nc\n')
    expect(out).toBe('a\nb\nc\n')
  })

  test('q stops processing and prints current line', () => {
    expect(ok('/two/q', 'one\ntwo\nthree')).toBe('one\ntwo\n')
  })

  test('infinite t-loops hit the execution guard', () => {
    expect(err(':a;s/^/=/;ta', 'x')).toMatch(/execution limit/)
  })
})

describe('blocks', () => {
  test('{} grouping shares one address test', () => {
    expect(ok('2{s/o/0/;s/b/B/}', 'bo\nbo\n')).toBe('bo\nB0\n')
  })

  test('negated block runs on non-matching lines', () => {
    expect(ok('/b/!d', 'a\nb\nc')).toBe('b\n')
  })
})

describe('#n directive and parse errors', () => {
  test('#n suppresses auto-print like -n', () => {
    expect(ok('#n\n2p', 'a\nb\n')).toBe('b\n')
  })

  test('unknown command reports cleanly', () => {
    expect(err('Z', '')).toBe("unknown command: `Z'")
  })

  test('unsupported filesystem commands are rejected up front', () => {
    expect(err('r /etc/passwd', 'x')).toContain('not supported')
    expect(err('w /tmp/out', 'x')).toContain('not supported')
  })

  test('unterminated s expression', () => {
    expect(err('s/abc', '')).toContain('unterminated')
  })

  test('missing label', () => {
    expect(err('bz', 'x')).toBe("can't find label for jump to `z'")
  })

  test('stray closing brace', () => {
    expect(err('}', 'x')).toBe("unexpected `}'")
  })
})

describe('edge cases', () => {
  test('empty input yields empty output', () => {
    expect(ok('s/a/b/', '')).toBe('')
  })

  test('input without trailing newline still terminates output', () => {
    expect(ok('p', 'single', { quiet: false })).toBe('single\nsingle\n')
  })

  test('$ matches only when on final input line', () => {
    expect(ok('$s/^/> /', 'a\nlast')).toBe('a\n> last\n')
  })

  test('anchors treat embedded newlines as line boundaries inside PS', () => {
    expect(ok('$!N;s/^2$/TWO/', '1\n2\n')).toBe('1\nTWO\n')
  })

  test('unusual but legal whitespace between commands', () => {
    expect(ok('s/a/X/ ; s/b/Y/', 'ab')).toBe('XY\n')
  })
})

describe('bugbot regressions', () => {
  const five = 'one\ntwo\nthree\nfour\nfive\n'

  test('numeric end at/before opening line makes a one-line range', () => {
    expect(ok('2,2d', five)).toBe('one\nthree\nfour\nfive\n')
    expect(ok('3,2d', five)).toBe('one\ntwo\nfour\nfive\n')
    expect(ok('/two/,2d', five)).toBe('one\nthree\nfour\nfive\n')
    // regex ends still scan from the following line
    expect(ok('/two/,/four/d', five)).toBe('one\nfive\n')
    expect(ok('2,+1d', five)).toBe('one\nfour\nfive\n')
  })

  test('gN and Ng flag orders both mean "skip past N-1, then global"', () => {
    // GNU: ignore matches before the numberth, then act as if g was given.
    expect(ok('s/a/-/2g', 'aaaa')).toBe('a---\n')
    expect(ok('s/a/-/g2', 'aaaa')).toBe('a---\n')
  })

  test('\\0 in the replacement is the whole match', () => {
    expect(ok('s/[0-9][0-9]*/[\\0]/g', 'ab12cd345')).toBe('ab[12]cd[345]\n')
  })

  test('persistent + one-shot case ops compose positionally', () => {
    expect(ok('s/.*/\\L\\u&/', 'HELLO WORLD')).toBe('Hello world\n')
    expect(ok('s/.*/\\U\\l&/', 'hello world')).toBe('hELLO WORLD\n')
    expect(ok('s/[a-z]+/<\\U&>/g', 'foo bar', { extendedRegex: true })).toBe('<FOO> <BAR>\n')
  })

  test('reading input via N resets the t-flag (POSIX)', () => {
    // Cycle 1 substitutes (sets the flag), then N reads a fresh line
    // (must clear it), so `t` does NOT fire and the explicit p runs.
    // Cycle 2 hits EOF inside N, leaving that cycle's substitution flag
    // intact — t fires and p is skipped.
    expect(ok('s/^/SUB /;$!N;t;p', 'aa\nbb\ncc\n', { quiet: true })).toBe('SUB aa\nbb\n')
  })

  test('a/backslash/space one-liner variant parses text after the backslash', () => {
    expect(ok('/b/a\\ appended!', 'a\nb\nc\n')).toBe('a\nb\nappended!\nc\n')
    expect(err('1a\\', 'x')).toContain("expected \\ after `a'")
  })

  test('q still drops queued append text (POSIX flush timing)', () => {
    // two matches /two/; its queued X is dropped because q exits before
    // the end-of-cycle flush, and line three never gets read.
    expect(ok('/two/{a X\nq}', 'one\ntwo\nthree\n')).toBe('one\ntwo\n')
  })
})
