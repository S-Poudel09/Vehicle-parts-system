import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// Abishek Tiwari: added Tailwind v4 Vite plugin for admin UI
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
})
