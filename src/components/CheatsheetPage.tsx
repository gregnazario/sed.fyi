import { useEffect, useMemo, useRef, useState } from 'react'
import { cheatCategories, cheatEntries } from '../data/cheatsheet'
import { navigate } from '../hooks/useHashRoute'
import type { CheatEntry } from '../types/cheatsheet'
import CheatEntryCard from './CheatEntryCard'
import type { PlaygroundState } from './SedPlayground'
import SedPlayground, {
  loadState,
  PLAYGROUND_DEFAULTS,
  PLAYGROUND_STORAGE_KEY,
} from './SedPlayground'
import SiteFooter from './SiteFooter'

const FLASH_DURATION_MS = 1200

function CheatsheetPage() {
  const [playground, setPlayground] = useState<PlaygroundState>(PLAYGROUND_DEFAULTS)
  const [flashPlayground, setFlashPlayground] = useState(false)
  const [query, setQuery] = useState('')
  const playgroundRef = useRef<HTMLDivElement | null>(null)
  const commandInputRef = useRef<HTMLInputElement | null>(null)
  const flashTimer = useRef<number | undefined>(undefined)
  const headingRef = useRef<HTMLHeadingElement | null>(null)
  const loadedFromStorage = useRef(false)

  useEffect(() => {
    setPlayground(loadState())
    loadedFromStorage.current = true
  }, [])

  // Debounced persistence: keystrokes shouldn't serialize (potentially
  // large) stdin on every render.
  const savedSnapshot = useRef('')
  useEffect(() => {
    if (!loadedFromStorage.current) return
    const serialized = JSON.stringify(playground)
    if (serialized === savedSnapshot.current) return
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(PLAYGROUND_STORAGE_KEY, serialized)
        savedSnapshot.current = serialized
      } catch {
        // Storage may be unavailable (private mode); the session still works.
      }
    }, 300)
    return () => window.clearTimeout(timer)
  }, [playground])

  useEffect(() => {
    document.title = 'interactive sed cheatsheet — sed.fyi'
    return () => {
      document.title = 'sed.fyi - Development Tools Portfolio'
    }
  }, [])

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true })
    return () => window.clearTimeout(flashTimer.current)
  }, [])

  const patchPlayground = (patch: Partial<PlaygroundState>) => {
    setPlayground((prev) => ({ ...prev, ...patch }))
  }

  const tryEntry = (entry: CheatEntry) => {
    patchPlayground({
      script: entry.command,
      input: entry.sampleInput,
      quiet: entry.quiet === true,
      extendedRegex: entry.ere === true,
    })
    setFlashPlayground(false)
    requestAnimationFrame(() => {
      playgroundRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      window.setTimeout(() => {
        commandInputRef.current?.focus({ preventScroll: true })
        setFlashPlayground(true)
        window.clearTimeout(flashTimer.current)
        flashTimer.current = window.setTimeout(() => setFlashPlayground(false), FLASH_DURATION_MS)
      }, 350)
    })
  }

  const jumpToSection = (key: string) => {
    document
      .getElementById(`section-${key}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const visibleEntries = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return cheatEntries
    return cheatEntries.filter(
      (entry) =>
        entry.command.toLowerCase().includes(q) ||
        entry.summary.toLowerCase().includes(q) ||
        (entry.detail ?? '').toLowerCase().includes(q),
    )
  }, [query])

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-white">
      <button
        type="button"
        onClick={() => document.getElementById('cs-main')?.focus()}
        className="skip-link cursor-pointer"
      >
        Skip to cheatsheet
      </button>

      {/* Header */}
      <header className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute -top-1/2 left-1/3 w-96 h-96 bg-brand-500/[0.08] rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-10">
          <nav aria-label="Breadcrumb">
            <button
              type="button"
              onClick={() => navigate('home')}
              className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
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
                  strokeWidth={2}
                  d="M11 17l-5-5m0 0l5-5m-5 5h12"
                />
              </svg>
              all projects
            </button>
          </nav>
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="mt-4 text-4xl sm:text-5xl font-bold tracking-tight outline-none"
          >
            <span className="bg-linear-to-r from-white via-white to-zinc-500 bg-clip-text text-transparent">
              the interactive sed cheatsheet
            </span>
          </h1>
          <p className="mt-3 text-lg text-zinc-400 max-w-2xl">
            Every example below runs on a real sed interpreter built into this page — tweak the
            input, break the regex, learn by poking at it.
          </p>
          <p className="mt-2 text-sm text-zinc-500 max-w-2xl">
            Patterns run with JavaScript-flavored regex under the hood (close enough for daily use);
            entries tagged{' '}
            <span className="text-amber-300 border border-amber-500/30 bg-amber-500/10 rounded px-1 py-px text-[10px] font-semibold uppercase">
              GNU
            </span>{' '}
            need GNU sed.
          </p>
        </div>
      </header>

      <main
        id="cs-main"
        tabIndex={-1}
        className="grow w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 outline-none"
      >
        {/* Playground */}
        <div ref={playgroundRef} className="scroll-mt-6">
          <div
            className={`rounded-xl transition-all duration-500 ${
              flashPlayground ? 'ring-2 ring-brand-500/60 ring-offset-4 ring-offset-zinc-950' : ''
            }`}
          >
            <SedPlayground
              state={playground}
              onChange={patchPlayground}
              commandInputRef={commandInputRef}
            />
          </div>
        </div>

        {/* Search + section quick-nav */}
        <div className="space-y-4">
          <div className="relative">
            <label htmlFor="cheat-search" className="sr-only">
              Search the cheatsheet
            </label>
            <svg
              className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
            <input
              id="cheat-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${cheatEntries.length} recipes — try "backreference", "-n", "delete"…`}
              autoComplete="off"
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl pl-10 pr-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-brand-500/40 transition-colors"
            />
          </div>
          <nav aria-label="Jump to section" className="flex flex-wrap gap-2">
            {cheatCategories.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => jumpToSection(cat.key)}
                disabled={!!query && !visibleEntries.some((e) => e.category === cat.key)}
                className="px-3 py-1.5 text-sm font-medium rounded-full border border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] transition-all cursor-pointer disabled:opacity-40 disabled:hover:bg-transparent"
              >
                {cat.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Sections */}
        {visibleEntries.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-zinc-500 text-lg">No recipes match “{query}”.</p>
            <button
              type="button"
              onClick={() => setQuery('')}
              className="mt-3 text-brand-300 hover:text-brand-200 text-sm font-medium cursor-pointer"
            >
              Clear search
            </button>
          </div>
        ) : (
          cheatCategories.map(({ key, label, blurb }) => {
            const entries = visibleEntries.filter((entry) => entry.category === key)
            if (entries.length === 0) return null
            return (
              <section
                key={key}
                id={`section-${key}`}
                className="scroll-mt-6"
                aria-labelledby={`${key}-heading`}
              >
                <div className="mb-5 flex items-baseline gap-3">
                  <h2 id={`${key}-heading`} className="text-xl font-bold text-white tracking-tight">
                    {label}
                  </h2>
                  <span className="text-sm text-zinc-600">{blurb}</span>
                  <span className="ml-auto text-xs text-zinc-600 tabular-nums">
                    {entries.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {entries.map((entry) => (
                    <CheatEntryCard key={entry.id} entry={entry} onTry={tryEntry} />
                  ))}
                </div>
              </section>
            )
          })
        )}
      </main>

      <SiteFooter />
    </div>
  )
}

export default CheatsheetPage
