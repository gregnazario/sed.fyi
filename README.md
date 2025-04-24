# Dev Tool Guide

A static website that explains how to run a dev tool across different operating systems.

## Features

- Built with Vite and TypeScript for type-safe development
- Responsive design using Tailwind CSS
- Clear instructions for both Unix-based systems and Windows
- Easy to deploy on GitHub Pages
- Custom domain support (sed.fyi)

## Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

4. Preview the production build:
   ```bash
   npm run preview
   ```

5. Type checking:
   ```bash
   npm run typecheck
   ```

## Deployment

The site is automatically deployed to GitHub Pages when changes are pushed to the main branch. To enable GitHub Pages with the custom domain:

1. Go to your repository settings
2. Navigate to "Pages" under "Code and automation"
3. Under "Build and deployment", select:
   - Source: Deploy from a branch
   - Branch: gh-pages
   - Folder: / (root)
4. Under "Custom domain", enter `sed.fyi`
5. Enable "Enforce HTTPS"

### DNS Configuration

For the custom domain to work, you'll need to configure your DNS settings:

1. Add an A record pointing to GitHub Pages IP addresses:
   - 185.199.108.153
   - 185.199.109.153
   - 185.199.110.153
   - 185.199.111.153

2. Add a CNAME record for www.sed.fyi pointing to your GitHub Pages URL

## Local Development

The site is a simple static HTML file with Tailwind CSS loaded via CDN. You can view it by opening `index.html` in your browser.

## License

MIT
