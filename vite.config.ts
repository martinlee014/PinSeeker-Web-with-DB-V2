
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // For Vercel, we use absolute path '/' instead of relative './'
  base: '/', 
  build: {
    outDir: 'dist',
    sourcemap: false
  },
  server: {
    host: true, // This exposes the app to your local network (e.g. 192.168.x.x)
    port: 5173
  }
})
