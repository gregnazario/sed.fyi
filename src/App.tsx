import ProjectCard from './components/ProjectCard'
import ProjectList from './components/ProjectList'
import ViewToggle from './components/ViewToggle'
import { useView, ViewProvider } from './context/ViewContext'
import { projects } from './data/projects'

function AppContent() {
  const { mode } = useView()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">sed.fyi</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                A collection of development tools and projects
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <ViewToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div
          className={
            mode === 'cards' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-6'
          }
        >
          {projects.map((project) =>
            mode === 'cards' ? (
              <ProjectCard key={project.id} project={project} />
            ) : (
              <ProjectList key={project.id} project={project} />
            ),
          )}
        </div>
      </main>

      <footer className="mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              © {new Date().getFullYear()} sed.fyi
            </p>
            <div className="flex space-x-6 mt-4 sm:mt-0">
              <a
                href="https://github.com/gregnazario"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
              >
                GitHub
              </a>
              <a
                href="https://gnazar.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
              >
                Portfolio
              </a>
            </div>
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
