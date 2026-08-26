import { useEffect, useMemo, useState } from 'react'
import { runSed } from '../lib/sed'
import type { CheatEntry } from '../types/cheatsheet'

const CopyIcon = () => (
  <svg
    className="w-3.5 h-3.5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M8 8V6a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2h-2m-8 0H6a2 2 0 01-2-2V6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 002 2z"
    />
  </svg>
)

interface CheatEntryCardProps {
  entry: CheatEntry
  onTry: (entry: CheatEntry) => void
}

const CheatEntryCard = ({ entry, onTry }: CheatEntryCardProps) => {
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 1500)
    return () => clearTimeout(timer)
  }, [copied])

  const output = useMemo(
    () =>
      runSed(entry.command, entry.sampleInput, {
        quiet: !!entry.quiet,
        extendedRegex: !!entry.ere,
      }),
    [entry],
  )

  const copyCommand = () => {
    navigator.clipboard?.writeText(entry.command).then(
      () => setCopied(true),
      () => undefined,
    )
  }

  return (
    <article
      className="group flex flex-col bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden hover:border-brand-500/30 transition-all duration-300"
      aria-label={entry.summary}
    >
      <div className="p-5 pb-4">
        {/* Command row */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <code className="flex-grow min-w-0 font-mono text-[13px] text-brand-300 bg-zinc-900/70 border border-white/[0.06] rounded-lg px-3 py-2 overflow-x-auto whitespace-pre">
            <span className="text-zinc-600 select-none">$ </span>
            <span className="text-zinc-400 select-none">
              sed{entry.quiet ? ' -n' : ''}
              {entry.ere ? ' -E' : ''}{' '}
            </span>
            {entry.command}
          </code>
          <button
            type="button"
            onClick={copyCommand}
            aria-label={`Copy command (${entry.id})`}
            className="shrink-0 p-1.5 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-all"
          >
            {copied ? (
              <span className="text-xs text-brand-400 font-medium">copied!</span>
            ) : (
              <CopyIcon />
            )}
          </button>
        </div>

        <div className="flex items-start gap-2">
          <h3 className="text-[15px] font-semibold text-white leading-snug">{entry.summary}</h3>
          {entry.gnuOnly && (
            <span
              className="shrink-0 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300 border border-amber-500/30 bg-amber-500/10 rounded"
              title="GNU sed extension — not available in BSD/macOS sed"
            >
              GNU
            </span>
          )}
        </div>

        {entry.detail && (
          <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{entry.detail}</p>
        )}
      </div>

      {/* Live before/after sample */}
      <div className="mt-auto">
        <div className="mx-5 mb-4 grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/[0.06] rounded-lg overflow-hidden border border-white/[0.06]">
          <div className="bg-zinc-900/80 p-3">
            <span className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5">
              input
            </span>
            <pre className="font-mono text-xs leading-relaxed text-zinc-300 whitespace-pre-wrap break-all max-h-32 overflow-auto scrollbar-none">
              {entry.sampleInput.trimEnd()}
            </pre>
          </div>
          <div className="bg-black/40 p-3">
            <span className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5">
              output
            </span>
            <pre className="font-mono text-xs leading-relaxed text-emerald-200/90 whitespace-pre-wrap break-all max-h-32 overflow-auto scrollbar-none">
              {output.ok ? output.output.trimEnd() || '(empty)' : `error: ${output.error}`}
            </pre>
          </div>
        </div>

        <div className="px-5 pb-5">
          <button
            type="button"
            onClick={() => onTry(entry)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium bg-brand-500/15 text-brand-300 border border-brand-500/25 rounded-lg hover:bg-brand-500/25 hover:border-brand-500/40 transition-all cursor-pointer"
          >
            Try it live
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5-5 5M6 12h12"
              />
            </svg>
          </button>
        </div>
      </div>
    </article>
  )
}

export default CheatEntryCard
