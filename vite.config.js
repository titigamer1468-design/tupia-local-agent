import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: './index.html' // Vite usará esto como el ancla principal
      }
    }
  },
  server: {
    fs: {
      strict: false, // Esto permite que Vite busque archivos fuera de su raíz si es necesario
    }
  }
})
