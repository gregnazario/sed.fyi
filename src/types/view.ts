export type ViewMode = 'cards' | 'list'

export interface ViewState {
  mode: ViewMode
  setMode: (mode: ViewMode) => void
}
