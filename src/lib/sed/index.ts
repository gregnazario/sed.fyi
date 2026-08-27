/**
 * Browser-side sed evaluator used by the interactive playground.
 * Supports the common core of the language (see parser.ts for the exact
 * command set); runs entirely client-side with JavaScript-flavored regex,
 * so exotic Perl-isms will diverge from GNU sed.
 */

export type { RunOptions, SedResult } from './engine'
export { runSed } from './engine'
