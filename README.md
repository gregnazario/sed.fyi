# Dev Tool Guide

A static website that explains how to run a dev tool across different operating systems.

## Features

- Built with Vite and TypeScript for type-safe development
- Responsive design using Tailwind CSS
- Clear instructions for both Unix-based systems and Windows
- Automatically deployed on Vercel
- Custom domain support (sed.fyi)

## Development

1. Install dependencies:
   ```bash
   bun install
   ```

2. Start the development server:
   ```bash
   bun run dev
   ```

3. Build for production:
   ```bash
   bun run build
   ```

4. Preview the production build:
   ```bash
   bun run preview
   ```

5. Type checking:
   ```bash
   bun run typecheck
   ```

## Deployment

The site is hosted on Vercel and deploys automatically when changes are pushed
to `main`. Build settings live in `vercel.json`: `bun run build`, output to
`dist/`, with an SPA rewrite so client-side routes resolve to `index.html`.

The `sed.fyi` domain is configured in the Vercel project's Domains settings,
and its DNS A records point at Vercel.

## Local Development

The site is a simple static HTML file with Tailwind CSS loaded via CDN. You can view it by opening `index.html` in your browser.

## License

MIT
