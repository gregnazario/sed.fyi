import { useView } from '../context/ViewContext'
import type { ViewMode } from '../types/view'

const ViewToggle = () => {
  const { mode, setMode } = useView()

  const handleModeChange = (newMode: ViewMode) => {
    setMode(newMode)
  }

  return (
    <div className="flex items-center gap-1 bg-white/[0.05] border border-white/[0.06] rounded-lg p-1">
      <button
        type="button"
        onClick={() => handleModeChange('cards')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
          mode === 'cards' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'
        }`}
        aria-label="Card view"
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
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          />
        </svg>
        Cards
      </button>

      <button
        type="button"
        onClick={() => handleModeChange('list')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
          mode === 'list' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'
        }`}
        aria-label="List view"
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
            d="M4 6h16M4 10h16M4 14h16M4 18h16"
          />
        </svg>
        List
      </button>
    </div>
  )
}

export default ViewToggle
