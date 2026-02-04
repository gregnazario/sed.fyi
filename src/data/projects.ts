import type { Project } from '../types/project'

export const projects: Project[] = [
  {
    id: 'move-playground',
    title: 'Move Playground',
    description:
      'An interactive playground for the Move programming language. Write, compile, and test Move smart contracts directly in your browser with real-time feedback and syntax highlighting.',
    url: 'https://move-playground.sed.fyi',
    techStack: ['TypeScript', 'React', 'Move', 'WebAssembly'],
    screenshot: '/screenshots/move-playground.png',
  },
  {
    id: 'pastebin',
    title: 'Pastebin',
    description:
      'A simple, fast, and secure pastebin service for sharing code snippets and text. Features syntax highlighting for multiple languages, expiration controls, and privacy options.',
    url: 'https://pastebin.sed.fyi',
    techStack: ['TypeScript', 'Node.js', 'Redis', 'PostgreSQL'],
    screenshot: '/screenshots/pastebin.png',
  },
]
