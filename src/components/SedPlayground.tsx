import { useEffect, useMemo, useState } from 'react'
import { runSed } from '../lib/sed'

export interface PlaygroundState {
  script: string
  input: string
  quiet: boolean
  extendedRegex: boolean
}

export const PLAYGROUND_DEFAULTS: PlaygroundState = {
  script: 's/tea/coffee/g',
  input: 'two cups of tea\nmore tea, and tea again\n',
  quiet: false,
  extendedRegex: false,
}

export const PLAYGROUND_STORAGE_KEY = 'sedPlaygroundV1'

export function loadState(): PlaygroundState {
  try {
    const raw = localStorage.getItem(PLAYGROUND_STORAGE_KEY)
    if (!raw) return PLAYGROUND_DEFAULTS
    const parsed = JSON.parse(raw) as Partial<PlaygroundState>
    return {
      script: typeof parsed.script === 'string' ? parsed.script : PLAYGROUND_DEFAULTS.script,
      input: typeof parsed.input === 'string' ? parsed.input : PLAYGROUND_DEFAULTS.input,
      quiet: parsed.quiet === true,
      extendedRegex: parsed.extendedRegex === true,
    }
  } catch {
    return PLAYGROUND_DEFAULTS
  }
}

const CopyButton = ({ text, label }: { text: string; label: string }) => {
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 1500)
    return () => clearTimeout(timer)
  }, [copied])

  return (
    <button
      type="button"
      aria-label={`${label} (copy to clipboard)`}
      onClick={() => {
        navigator.clipboard?.writeText(text).then(
          () => setCopied(true),
          () => undefined,
        )
      }}
      className="shrink-0 p-1.5 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-all"
    >
      {copied ? (
        <svg
          className="w-4 h-4 text-brand-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg
          className="w-4 h-4"
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
      )}
    </button>
  )
}

interface SedPlaygroundProps {
  state: PlaygroundState
  onChange: (patch: Partial<PlaygroundState>) => void
  /** Ref for the command input so "Try it" buttons can focus it. */
  commandInputRef?: React.RefObject<HTMLInputElement | null>
}

const SedPlayground = ({ state, onChange, commandInputRef }: SedPlaygroundProps) => {
  const result = useMemo(
    () =>
      runSed(state.script, state.input, { quiet: state.quiet, extendedRegex: state.extendedRegex }),
    [state.script, state.input, state.quiet, state.extendedRegex],
  )

  return (
    <section
      aria-label="Interactive sed playground"
      className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden"
    >
      {/* Command bar */}
      <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-white/[0.06] bg-white/[0.02]">
        <label htmlFor="sed-script" className="sr-only">
          sed command
        </label>
        <div className="flex items-center flex-grow min-w-0 gap-2 bg-zinc-900/80 border border-white/[0.08] rounded-lg px-3 py-2 focus-within:border-brand-500/50 transition-colors">
          <span
            className="text-brand-400 font-mono text-sm select-none shrink-0"
            aria-hidden="true"
          >
            $
          </span>
          <span
            className="text-brand-300/80 font-mono text-sm select-none shrink-0"
            aria-hidden="true"
          >
            sed{' '}
          </span>
          <input
            id="sed-script"
            ref={commandInputRef}
            type="text"
            value={state.script}
            onChange={(e) => onChange({ script: e.target.value })}
            spellCheck={false}
            autoComplete="off"
            placeholder="'s/find/replace/'"
            className="flex-grow min-w-0 bg-transparent font-mono text-sm text-zinc-100 placeholder:text-zinc-600 outline-none"
          />
        </div>

        <fieldset className="m-0 flex items-center gap-1 self-start border-0 p-0 sm:self-center">
          <legend className="sr-only">sed flags</legend>
          <button
            type="button"
            aria-pressed={state.quiet}
            title="-n: suppress automatic printing of pattern space"
            onClick={() => onChange({ quiet: !state.quiet })}
            className={`px-3 py-1.5 font-mono text-sm rounded-lg border transition-all ${
              state.quiet
                ? 'bg-brand-500/20 text-brand-300 border-brand-500/30'
                : 'text-zinc-500 border-white/[0.08] hover:text-zinc-300'
            }`}
          >
            -n
          </button>
          <button
            type="button"
            aria-pressed={state.extendedRegex}
            title="-E: use extended regular expressions"
            onClick={() => onChange({ extendedRegex: !state.extendedRegex })}
            className={`px-3 py-1.5 font-mono text-sm rounded-lg border transition-all ${
              state.extendedRegex
                ? 'bg-brand-500/20 text-brand-300 border-brand-500/30'
                : 'text-zinc-500 border-white/[0.08] hover:text-zinc-300'
            }`}
          >
            -E
          </button>
          <button
            type="button"
            title="Reset the playground"
            onClick={() => onChange(PLAYGROUND_DEFAULTS)}
            className="px-2 py-1.5 text-zinc-600 hover:text-zinc-300 transition-colors"
            aria-label="Reset playground"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
              />
            </svg>
          </button>
        </fieldset>
      </div>

      {/* I/O panes */}
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/[0.06]">
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="sed-input"
              className="text-xs font-medium uppercase tracking-wider text-zinc-500"
            >
              stdin
            </label>
            <CopyButton text={state.input} label="Copy input" />
          </div>
          <textarea
            id="sed-input"
            value={state.input}
            onChange={(e) => onChange({ input: e.target.value })}
            rows={7}
            spellCheck={false}
            placeholder="Type your sample text here…"
            className="w-full resize-y bg-transparent font-mono text-sm leading-relaxed text-zinc-100 placeholder:text-zinc-600 outline-none scrollbar"
          />
        </div>

        <div className="p-4 bg-black/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              stdout
            </span>
            {result.ok && <CopyButton text={result.output} label="Copy output" />}
          </div>
          {result.ok ? (
            <div role="status" aria-label="Command output">
              <pre className="font-mono text-sm leading-relaxed text-zinc-100 whitespace-pre-wrap break-all max-h-72 overflow-auto scrollbar-none">
                {result.output || <span className="text-zinc-600">(empty)</span>}
              </pre>
            </div>
          ) : (
            <div
              role="alert"
              className="font-mono text-sm leading-relaxed text-red-300 bg-red-500/10 border border-red-500/25 rounded-lg px-3 py-2"
            >
              sed: {result.error}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default SedPlayground
