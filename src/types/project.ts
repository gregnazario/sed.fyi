/** Category for organizing and filtering projects */
export type ProjectCategory = 'tool' | 'library' | 'service'

/** Development status of a project */
export type ProjectStatus = 'active' | 'beta' | 'coming-soon'

export interface Project {
  /** Unique kebab-case identifier */
  id: string
  /** Display name */
  title: string
  /** 1-2 sentence description of the project */
  description: string
  /** Live URL where the project can be accessed */
  url: string
  /** List of technologies used */
  techStack: string[]
  /** Project category for filtering */
  category: ProjectCategory
  /** Path to screenshot image in /public/screenshots/ */
  screenshot?: string
  /** GitHub repository URL */
  githubUrl?: string
  /** Current development status (defaults to 'active' if omitted) */
  status?: ProjectStatus
}
