import { useMemo, useState } from 'react'
import CheatsheetPage from './components/CheatsheetPage'
import ProjectCard from './components/ProjectCard'
import ProjectList from './components/ProjectList'
import SiteFooter from './components/SiteFooter'
import ViewToggle from './components/ViewToggle'
import { useView, ViewProvider } from './context/ViewContext'
import { projects } from './data/projects'
import { useHashRoute } from './hooks/useHashRoute'
import type { ProjectCategory } from './types/project'

const CATEGORY_LABELS: Record<ProjectCategory | 'all', string> = {
  all: 'All',
  tool: 'Tools',
  library: 'Libraries',
  service: 'Services',
}

const CheatsheetCta = () => (
  <a
    href="#/cheatsheet"
    className="group mt-8 inline-flex max-w-2xl items-center gap-4 bg-white/[0.03] border border-white/[0.08] rounded-xl px-5 py-4 hover:border-brand-500/40 hover:bg-white/[0.05] transition-all duration-300"
  >
    <span
      className="shrink-0 w-11 h-11 rounded-lg bg-brand-500/15 border border-brand-500/25 flex items-center justify-center font-mono text-sm font-semibold text-brand-300"
      aria-hidden="true"
    >
      s/
    </span>
    <span>
      <span className="flex items-center gap-2 text-[15px] font-semibold text-white group-hover:text-brand-200 transition-colors">
        the interactive sed cheatsheet
        <svg
          className="w-4 h-4 text-zinc-500 group-hover:text-brand-300 group-hover:translate-x-0.5 transition-all"
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
      </span>
      <span className="mt-1 block text-sm text-zinc-400">
        Run real sed recipes right in your browser — a playground plus live examples.
      </span>
    </span>
  </a>
)

function AppContent() {
  const route = useHashRoute()
  const { mode } = useView()
  const [activeCategory, setActiveCategory] = useState<ProjectCategory | 'all'>('all')

  const uniqueCategories = useMemo(() => [...new Set(projects.map((p) => p.category))], [])
  const showCategoryFilter = uniqueCategories.length > 1

  const filteredProjects =
    activeCategory === 'all' ? projects : projects.filter((p) => p.category === activeCategory)

  if (route === 'cheatsheet') {
    return <CheatsheetPage />
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-white">
      {/* Skip-to-content link for keyboard users */}
      <a href="#projects" className="skip-link">
        Skip to projects
      </a>

      {/* Hero */}
      <header className="relative overflow-hidden border-b border-white/[0.06]">
        {/* Gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute -top-1/2 left-1/4 w-96 h-96 bg-brand-500/[0.08] rounded-full blur-3xl" />
          <div className="absolute -top-1/2 right-1/4 w-96 h-96 bg-amber-500/[0.06] rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight animate-fade-in">
              <span className="bg-linear-to-r from-white via-white to-zinc-500 bg-clip-text text-transparent">
                sed.fyi
              </span>
            </h1>
            <p className="mt-4 text-lg sm:text-xl text-zinc-400 max-w-2xl animate-slide-up">
              Open-source development tools built for the modern web.
            </p>
            <CheatsheetCta />
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div
        className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-xl border-b border-white/[0.06]"
        role="toolbar"
        aria-label="Project filters and view options"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          {showCategoryFilter ? (
            <nav className="flex items-center gap-1.5" aria-label="Filter by category">
              {(['all', ...uniqueCategories] as (ProjectCategory | 'all')[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  aria-pressed={activeCategory === cat}
                  className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all ${
                    activeCategory === cat
                      ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                      : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
                  }`}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </nav>
          ) : (
            <div className="text-sm text-zinc-500 font-medium">
              {projects.length} {projects.length === 1 ? 'project' : 'projects'}
            </div>
          )}
          <ViewToggle />
        </div>
      </div>

      {/* Projects */}
      <main
        id="projects"
        className="grow max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12"
        aria-label="Projects"
      >
        {filteredProjects.length > 0 ? (
          <div
            className={
              mode === 'cards'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
            }
          >
            {filteredProjects.map((project) =>
              mode === 'cards' ? (
                <ProjectCard key={project.id} project={project} />
              ) : (
                <ProjectList key={project.id} project={project} />
              ),
            )}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-zinc-500 text-lg">No projects in this category yet.</p>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}

function App() {
  return (
    <ViewProvider>
      <AppContent />
    </ViewProvider>
  )
}

export default App
