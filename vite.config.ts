import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Use relative paths ('./') so the app works on any GitHub Pages repo
  // without needing to hardcode the repository name.
  base: './', 
})