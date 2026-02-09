import type { Project } from '../types/project'

/**
 * ──────────────────────────────────────────────
 *  Project Registry
 * ──────────────────────────────────────────────
 *
 * To add a new tool, append an entry to the array below.
 * Place a screenshot in /public/screenshots/ (optional but recommended).
 *
 * Template:
 *
 * {
 *   id: 'my-tool',                          // unique kebab-case identifier
 *   title: 'My Tool',                       // display name
 *   description: 'What the tool does...',   // 1-2 sentence description
 *   url: 'https://my-tool.sed.fyi',        // live URL
 *   category: 'tool',                       // 'tool' | 'library' | 'service'
 *   techStack: ['TypeScript', 'React'],     // technologies used
 *   screenshot: '/screenshots/my-tool.png', // optional: screenshot path
 *   githubUrl: 'https://github.com/...',    // optional: GitHub repo URL
 *   status: 'active',                       // optional: 'active' | 'beta' | 'coming-soon'
 * },
 */
export const projects: Project[] = [
  {
    id: 'move-playground',
    title: 'Move Playground',
    description:
      'An interactive playground for the Move programming language. Write, compile, and test Move smart contracts directly in your browser with real-time feedback and syntax highlighting.',
    url: 'https://move-playground.sed.fyi',
    category: 'tool',
    techStack: ['TypeScript', 'React', 'Move', 'WebAssembly'],
    screenshot: '/screenshots/move-playground.png',
  },
  {
    id: 'pastebin',
    title: 'Secure Pastebin',
    description:
      'Share files securely with post-quantum encryption. Features ML-KEM (Kyber) + AES-256-GCM hybrid encryption, Argon2id password protection, and decentralized storage on Shelby Protocol.',
    url: 'https://pastebin.sed.fyi',
    category: 'tool',
    techStack: ['TypeScript', 'Post-Quantum Crypto', 'Shelby Protocol', 'React'],
    screenshot: '/screenshots/pastebin.png',
  },
  {
    id: 'tubes',
    title: 'Tubes',
    description:
      'Decentralized website hosting powered by Aptos and Shelby Protocol. Deploy and serve static sites directly from the blockchain with no centralized infrastructure.',
    url: 'https://tubes.lol',
    category: 'service',
    techStack: ['Aptos', 'Shelby Protocol'],
    status: 'active',
  },
]
