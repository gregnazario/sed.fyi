import { createContext, type ReactNode, useContext, useEffect, useState } from 'react'
import type { ViewMode, ViewState } from '../types/view'

const ViewContext = createContext<ViewState | undefined>(undefined)

interface ViewProviderProps {
  children: ReactNode
}

export function ViewProvider({ children }: ViewProviderProps) {
  const [mode, setModeState] = useState<ViewMode>('cards')

  useEffect(() => {
    const savedMode = localStorage.getItem('viewMode') as ViewMode
    if (savedMode && (savedMode === 'cards' || savedMode === 'list')) {
      setModeState(savedMode)
    }
  }, [])

  const setMode = (newMode: ViewMode) => {
    setModeState(newMode)
    localStorage.setItem('viewMode', newMode)
  }

  return <ViewContext.Provider value={{ mode, setMode }}>{children}</ViewContext.Provider>
}

export function useView() {
  const context = useContext(ViewContext)
  if (context === undefined) {
    throw new Error('useView must be used within a ViewProvider')
  }
  return context
}
