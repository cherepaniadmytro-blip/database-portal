import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Project site: https://cherepaniadmytro-blip.github.io/database-portal/
export default defineConfig({
  base: '/database-portal/',
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
})
