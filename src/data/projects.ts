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
    title: 'Secure Pastebin',
    description:
      'Share files securely with post-quantum encryption. Features ML-KEM (Kyber) + AES-256-GCM hybrid encryption, Argon2id password protection, and decentralized storage on Shelby Protocol.',
    url: 'https://pastebin.sed.fyi',
    techStack: ['TypeScript', 'Post-Quantum Crypto', 'Shelby Protocol', 'React'],
    screenshot: '/screenshots/pastebin.png',
  },
]
