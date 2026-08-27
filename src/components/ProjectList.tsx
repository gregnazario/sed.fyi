import { useState } from 'react'
import { STATUS_STYLES } from '../constants/status'
import type { Project } from '../types/project'

interface ProjectListProps {
  project: Project
}

const ProjectList = ({ project }: ProjectListProps) => {
  const [imgError, setImgError] = useState(false)
  const status = project.status ?? 'active'
  const { label: statusLabel, className: statusClassName } = STATUS_STYLES[status]

  return (
    <article
      className="group bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 hover:border-brand-500/30 hover:bg-white/[0.05] transition-all duration-300"
      aria-label={project.title}
    >
      <div className="flex items-start gap-5">
        {/* Thumbnail */}
        {project.screenshot && !imgError && (
          <div className="hidden sm:block shrink-0 w-40 h-24 bg-zinc-900 rounded-lg overflow-hidden">
            <img
              src={project.screenshot}
              alt={`${project.title} screenshot`}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
              onError={() => setImgError(true)}
            />
          </div>
        )}

        {/* Content */}
        <div className="grow min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-2">
            <div className="flex items-center gap-3 min-w-0">
              <h3 className="text-lg font-semibold text-white group-hover:text-brand-300 transition-colors truncate">
                {project.title}
              </h3>
              <span
                className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-full border shrink-0 ${statusClassName}`}
              >
                {statusLabel}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={project.url}
                {...(project.internalLink ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-brand-500/15 text-brand-300 border border-brand-500/25 rounded-lg hover:bg-brand-500/25 hover:border-brand-500/40 transition-all"
              >
                {project.internalLink ? 'Open' : 'Visit'}
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={
                      project.internalLink
                        ? 'M13 7l5 5-5 5M6 12h12'
                        : 'M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14'
                    }
                  />
                </svg>
              </a>
              {project.githubUrl && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-zinc-400 border border-white/[0.08] rounded-lg hover:text-zinc-200 hover:border-white/20 hover:bg-white/[0.04] transition-all"
                  aria-label={`${project.title} on GitHub`}
                >
                  <span className="sr-only">GitHub</span>
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                </a>
              )}
            </div>
          </div>

          <p className="text-zinc-400 text-sm leading-relaxed mb-3 line-clamp-2">
            {project.description}
          </p>

          <ul className="flex flex-wrap gap-1.5 list-none" aria-label="Technologies used">
            {project.techStack.map((tech) => (
              <li
                key={tech}
                className="px-2 py-0.5 text-xs font-medium bg-white/[0.06] text-zinc-400 rounded-md border border-white/[0.06]"
              >
                {tech}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  )
}

export default ProjectList
