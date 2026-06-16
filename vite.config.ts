/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Repo name for GitHub Pages. The Pages deploy serves the app under
// https://<user>.github.io/<REPO_NAME>/, so production assets need this base.
// Local `npm run dev` and `npm run preview` stay at '/'; see DECISIONS.md.
const REPO_NAME = 'studying';

export default defineConfig(({ command }) => ({
  // Set REPO_NAME to '' when hosting at a domain root (Netlify/Vercel/Cloudflare).
  base: command === 'build' && REPO_NAME ? `/${REPO_NAME}/` : '/',
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'content/**/*.test.ts'],
    setupFiles: ['src/test-setup.ts'],
  },
}));
