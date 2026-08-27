import { navigate } from '../hooks/useHashRoute'

/** Shared footer used on both the registry and the cheatsheet page. */
const SiteFooter = () => (
  <footer className="border-t border-white/[0.06] mt-auto">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="text-zinc-600 text-sm">&copy; {new Date().getFullYear()} sed.fyi</p>
        <nav aria-label="Footer links" className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => navigate('cheatsheet')}
            className="text-zinc-500 hover:text-zinc-300 transition-colors text-sm cursor-pointer"
          >
            sed cheatsheet
          </button>
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
)

export default SiteFooter
