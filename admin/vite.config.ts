import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// admin is a separate Vite app (root = admin/), sharing the root .env file.
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
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
