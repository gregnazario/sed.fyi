import { useMemo, useState } from 'react'
import ProjectCard from './components/ProjectCard'
import ProjectList from './components/ProjectList'
import RedPandaMascot from './components/RedPandaMascot'
import ViewToggle from './components/ViewToggle'
import { useView, ViewProvider } from './context/ViewContext'
import { projects } from './data/projects'
import type { ProjectCategory } from './types/project'

const CATEGORY_LABELS: Record<ProjectCategory | 'all', string> = {
  all: 'All',
  tool: 'Tools',
  library: 'Libraries',
  service: 'Services',
}

function AppContent() {
  const { mode } = useView()
  const [activeCategory, setActiveCategory] = useState<ProjectCategory | 'all'>('all')

  const uniqueCategories = useMemo(() => [...new Set(projects.map((p) => p.category))], [])
  const showCategoryFilter = uniqueCategories.length > 1

  const filteredProjects =
    activeCategory === 'all' ? projects : projects.filter((p) => p.category === activeCategory)

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
          <div className="flex items-center gap-6 sm:gap-8">
            {/* Mascot */}
            <div className="shrink-0 animate-fade-in">
              <RedPandaMascot size={100} variant="full" className="hidden sm:block" />
              <RedPandaMascot size={64} variant="head" className="sm:hidden" />
            </div>

            <div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight animate-fade-in">
                <span className="bg-gradient-to-r from-white via-white to-zinc-500 bg-clip-text text-transparent">
                  sed.fyi
                </span>
              </h1>
              <p className="mt-4 text-lg sm:text-xl text-zinc-400 max-w-2xl animate-slide-up">
                Open-source development tools built for the modern web.
              </p>
            </div>
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
        className="flex-grow max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12"
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

      {/* Footer */}
      <footer className="border-t border-white/[0.06] mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <RedPandaMascot size={24} variant="head" />
              <p className="text-zinc-600 text-sm">&copy; {new Date().getFullYear()} sed.fyi</p>
            </div>
            <nav aria-label="Footer links" className="flex items-center gap-6">
              <a
                href="https://github.com/gregnazario"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-500 hover:text-zinc-300 transition-colors text-sm"
              >
                GitHub
              </a>
              <a
                href="https://gnazar.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-500 hover:text-zinc-300 transition-colors text-sm"
              >
                Portfolio
              </a>
            </nav>
          </div>
        </div>
      </footer>
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
