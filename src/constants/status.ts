import type { ProjectStatus } from '../types/project'

/** Shared status badge configuration used by both card and list views */
export const STATUS_STYLES: Record<ProjectStatus, { label: string; className: string }> = {
  active: {
    label: 'Active',
    className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  },
  beta: {
    label: 'Beta',
    className: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  },
  'coming-soon': {
    label: 'Coming Soon',
    className: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/25',
  },
}
