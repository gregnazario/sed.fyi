export type CheatCategory = 'substitution' | 'printing' | 'deletion' | 'textEditing' | 'advanced'

export interface CheatEntry {
  /** Stable slug, used as React key and element id. */
  id: string
  /** The sed script (single expression or semicolon-joined pipeline). */
  command: string
  summary: string
  /** Longer explanation shown under the command. */
  detail?: string
  sampleInput: string
  /** Run with -n (needed for p-style examples). */
  quiet?: boolean
  /** Run with -E (extended regex). */
  ere?: boolean
  /** Flag with a GNU sed badge — BSD/macOS sed lacks this feature. */
  gnuOnly?: boolean
  category: CheatCategory
}
