import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// admin is a separate Vite app (root = admin/), sharing the root .env file.
// ponytail: base stays '/' — admin deploys at its own domain root (admin.physio-prime.in);
// '/admin/' produced dead /admin/assets/* URLs that the SPA rewrite fell back to index.html for.
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  base: '/',
  envDir: '..',
  plugins: [react(), tailwindcss()],
  server: {
    port: 5175,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})
