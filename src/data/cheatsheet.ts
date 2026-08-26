import type { CheatEntry } from '../types/cheatsheet'

/**
 * Every entry's shown output is computed live by the bundled engine
 * (src/lib/sed), so examples can't drift from what the playground runs.
 * Scripts marked gnuOnly rely on GNU extensions; everything else also works
 * on BSD/macOS sed — all non-GNU scripts were diffed against real sed.
 */
export const cheatEntries: CheatEntry[] = [
  // ---- substitution --------------------------------------------------------
  {
    id: 'substitute-first',
    category: 'substitution',
    command: 's/tea/coffee/',
    summary: 'Replace the first `tea` on every line',
    detail:
      'Without flags, s/// stops after one replacement per line. This is the workhorse: sed reads each line, applies the script, prints the result.',
    sampleInput: 'two cups of tea\nmore tea, and tea again\n',
  },
  {
    id: 'substitute-global',
    category: 'substitution',
    command: 's/tea/coffee/g',
    summary: 'Replace every match with the g flag',
    sampleInput: 'two cups of tea\nmore tea, and tea again\n',
  },
  {
    id: 'case-insensitive',
    category: 'substitution',
    command: 's/hello/bye/gI',
    summary: 'Match case-insensitively with the I flag',
    detail: 'Combine freely with other flags in any order. sed can take i or I.',
    sampleInput: 'Hello there!\nHELLO world\nhello.\n',
  },
  {
    id: 'wrap-whole-match',
    category: 'substitution',
    command: 's/[0-9][0-9]*/<N:&>/g',
    summary: 'Reuse the whole match with &',
    detail:
      '& stands for whatever the regex matched — no capture group needed for simple wrapping. The doubled [0-9]* keeps it portable to BRE.',
    sampleInput: 'room 12, floor 3\ncall 5550199\nnothing numeric here\n',
  },
  {
    id: 'swap-fields',
    category: 'substitution',
    command: 's/^\\(.*\\), \\(.*\\)$/\\2 \\1/',
    summary: 'Swap "Last, First" to "First Last" with backreferences',
    detail:
      '\\( ... \\) captures a group in BRE syntax (the default). Use \\1..\\9 in the replacement to paste captures back — or run sed -E and write plain (...).',
    sampleInput: 'Doe, John\nSmith, Jane Ada\nVon Trapp, Maria\n',
  },
  {
    id: 'extract-between',
    category: 'substitution',
    command: 's/^.*<title>\\(.*\\)<\\/title>.*$/\\1/',
    summary: 'Extract text between two markers onto its own line',
    detail:
      'Greedy .* eats up to the last <title> on the line, the capture grabs the middle, and .* swallows the closing tag.',
    sampleInput:
      '<html><title>Hello, sed</title></html>\n<title>second</title>\nno title on this line\n',
  },
  {
    id: 'collapse-spaces',
    category: 'substitution',
    command: 's/  */ /g',
    summary: 'Collapse runs of spaces into a single space',
    detail:
      'The classic portable form — in BRE, + is not special, so two spaces followed by * means "one-or-more". With -E you can write s/ +/ /g.',
    sampleInput: 'too     many    spaces\nnone\na bit   of both\n',
  },
  {
    id: 'trim-trailing-whitespace',
    category: 'substitution',
    command: 's/[[:space:]]*$//',
    summary: 'Trim trailing whitespace from every line',
    detail:
      '[[:space:]] is the portable way to say any whitespace (spaces and tabs) inside bracket expressions.',
    sampleInput: 'line one   \nline two\t\nclean line\n',
  },
  {
    id: 'uppercase-line',
    category: 'substitution',
    command: 's/.*/\\U&/',
    summary: 'Uppercase an entire line with \\U',
    detail:
      '\\U uppercases until \\E, \\L lowercases, and \\u/\\l affect just the next character. A GNU extension not found in BSD sed.',
    sampleInput: 'shout this please\nMixed Case Input\n',
    gnuOnly: true,
  },

  // ---- printing & selection -------------------------------------------------
  {
    id: 'print-only-matching',
    category: 'printing',
    command: '/pattern/p',
    summary: 'Print only matching lines (-n p)',
    detail:
      '-n silences the automatic per-line print, so only explicit p commands produce output. This pair is the standard grep-like mode of sed.',
    sampleInput: 'first\nfind me here\nthird\nanother find me line\nlast\n',
    quiet: true,
  },
  {
    id: 'print-range',
    category: 'printing',
    command: '2,4p',
    summary: 'Print just a slice of the file (-n N,Mp)',
    detail:
      'Addresses can be line numbers, $ for the last line, /regex/, or comma-separated ranges like 5,$.',
    sampleInput: 'one\ntwo\nthree\nfour\nfive\nsix\n',
    quiet: true,
  },
  {
    id: 'number-last-line',
    category: 'printing',
    command: '$=',
    summary: 'Count input lines ($=)',
    detail:
      '= prints the current line number. Used alone it numbers every line; anchored with $ it reports the total.',
    sampleInput: 'a\nb\nc\nd\ne\n',
    quiet: true,
  },
  {
    id: 'quote-comments',
    category: 'printing',
    command: '/^#/!s/^/> comment: /',
    summary: 'Edit some lines but leave others alone (!)',
    detail:
      '! negates the address that follows it. Here substitution applies only to lines NOT starting with #.',
    sampleInput: '# release notes\nfixed a bug\n# known issues\nnone, obviously\n',
  },

  // ---- deletion --------------------------------------------------------------
  {
    id: 'delete-matching',
    category: 'deletion',
    command: '/debug/d',
    summary: 'Delete lines containing a pattern',
    detail:
      'd starts the next cycle immediately — nothing further in the script runs and the line is never printed.',
    sampleInput: 'INFO server started\nDEBUG probe tick\nwarn disk low\nDEBUG cache miss\n',
  },
  {
    id: 'delete-blank-lines',
    category: 'deletion',
    command: '/^[[:space:]]*$/d',
    summary: 'Squeeze out blank and whitespace-only lines',
    detail:
      '^$ matches truly empty lines; the character class adds blank-ish lines that contain only spaces or tabs.',
    sampleInput: 'para one continues\n\nstill para one\n \n\tpara two\n',
  },
  {
    id: 'delete-range-lines',
    category: 'deletion',
    command: '2,4d',
    summary: 'Delete a numbered range of lines',
    detail:
      'Other favorites: 10,$d drops from line ten to the end; $d trims exactly one trailing line.',
    sampleInput: 'keep\nsnip\nsnip\nsnip\nkeep me too\n',
  },
  {
    id: 'strip-comment-lines',
    category: 'deletion',
    command: '/^[[:space:]]*#/d',
    summary: 'Strip commented lines from config files',
    detail:
      'Allows leading whitespace before the # so indented comments die too. Combine with s/#.*// to keep inline comments trimmed instead.',
    sampleInput: '# port settings\nport = 8080\n  # legacy option\nhost = localhost\n',
  },
  {
    id: 'dos-to-unix',
    category: 'deletion',
    command: 's/\\r$//',
    summary: 'Convert CRLF line endings to LF (dos2unix)',
    detail: 'Windows text files carry a carriage return before each newline; strip it and rewrite.',
    sampleInput: 'report,2024\r\nstatus,OK\r\nnotes,fine\r\n',
  },
  {
    id: 'delete-every-other',
    category: 'deletion',
    command: 'n;d',
    summary: 'Delete every second line (n;d)',
    detail:
      'n prints the current line (respecting -n), pulls the next into the pattern space, then d deletes it — odd lines survive.',
    sampleInput: 'row 1\nrow 2\nrow 3\nrow 4\nrow 5\n',
  },

  // ---- editing & inserting -----------------------------------------------------
  {
    id: 'insert-header',
    category: 'textEditing',
    command: '1i // AUTO-GENERATED — DO NOT EDIT',
    summary: 'Insert a header before line one (GNU one-liner)',
    detail:
      'The GNU shorthand `1i text` puts the text on the same line; classic portable form needs the text on its own following line after a backslash.',
    sampleInput: 'exports.handler = async () => {}\n',
    gnuOnly: true,
  },
  {
    id: 'append-after-match',
    category: 'textEditing',
    command: '/server {/a \\    proxy_pass http://upstream;',
    summary: 'Append a line after every block opener',
    detail:
      'With -i.sed (in-place edit, GNU/BSD flag differences aside) this style of insertion is how people script nginx edits safely.',
    sampleInput: 'server {\n  listen 80;\n}\nserver {\n  listen 443;\n}\n',
    gnuOnly: true,
  },
  {
    id: 'change-matching-line',
    category: 'textEditing',
    command: '/exact_mode/c exact_mode = false',
    summary: 'Replace whole matching lines with new content',
    detail:
      'c wipes the addressed line(s) and substitutes fixed text — simpler than getting a tricky regex to rewrite an entire line.',
    sampleInput: '[settings]\ndebug = true\nlog_level = info\nexact_mode = true\n',
    gnuOnly: true,
  },
  {
    id: 'join-pairs',
    category: 'textEditing',
    command: 'N;s/\\n/,/',
    summary: 'Join every two lines with a comma (N)',
    detail:
      'N appends the next input line to the pattern space with an embedded newline; the substitution then rewrites that separator.',
    sampleInput: 'a,b\n1,2\nc,d\n3,4\n',
  },

  // ---- advanced ------------------------------------------------------------------
  {
    id: 'reverse-lines',
    category: 'advanced',
    command: '1!G;h;$!d',
    summary: 'Reverse a file line-by-line (tac)',
    detail:
      'Each pass G-glues the accumulated hold space under the current line, h saves it back, and $!d postpones printing until the final line prints the stack at once.',
    sampleInput: 'first\nsecond\nthird\nlast\n',
  },
  {
    id: 'double-space',
    category: 'advanced',
    command: 'G',
    summary: 'Double-space a file',
    detail:
      'G appends the hold space (empty at start) below the pattern space as a blank line — the tiniest useful hold-space trick.',
    sampleInput: 'compact\nreport\nlines\n',
  },
  {
    id: 'squeeze-duplicates',
    category: 'advanced',
    command: '$!N;/^\\(.*\\)\\n\\1$/!P;D',
    summary: 'uniq: collapse adjacent duplicate lines',
    detail:
      'The canonical P/D pump: look ahead one line, print via P only when the pair differs, delete the top half through D, and loop without refilling — handles run-ends cleanly.',
    sampleInput: 'alpha\nalpha\nalpha\nbeta\nbeta\ngamma\ndelta\ndelta\n',
  },
  {
    id: 'number-every-line',
    category: 'advanced',
    command: '=;s/^/  /',
    summary: 'Number the file with a bare =',
    detail:
      'the = command emits the line number above each printed line regardless of -n; pairing commands on one line with ; is normal sed style.',
    sampleInput: 'beer\nnuts\n',
  },
]

/** Display metadata keyed by category, in presentation order. */
export const cheatCategories: { key: CheatEntry['category']; label: string; blurb: string }[] = [
  { key: 'substitution', label: 'Substitution', blurb: 's/// is sed\u2019s reason for existing.' },
  { key: 'printing', label: 'Printing & selection', blurb: 'Choose which lines see daylight.' },
  { key: 'deletion', label: 'Deletion', blurb: 'What d eats stays gone.' },
  { key: 'textEditing', label: 'Insert & replace lines', blurb: 'Whole-line surgery: i, a and c.' },
  {
    key: 'advanced',
    label: 'Multiline & hold space',
    blurb: 'Pattern space choreography: N, P, D, G.',
  },
]
