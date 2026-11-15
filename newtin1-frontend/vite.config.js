import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The dev server proxies /api to Spring Boot, so the browser sees ONE origin.
// That means no CORS preflights and the SameSite=Strict refresh cookie just works.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:8080', changeOrigin: false },
    },
  },
})
