import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174,
    // Forward /api/* to the Python backend during development so the
    // frontend never needs to know the backend host.
    proxy: {
      '/api': { target: 'http://localhost:8000', changeOrigin: true },
      // Rendered PNGs are served by the backend under /outputs.
      '/outputs': { target: 'http://localhost:8000', changeOrigin: true },
    },
  },
})
