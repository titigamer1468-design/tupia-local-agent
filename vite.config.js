import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      // Esto es la magia: permite JSX en archivos .js
      include: "**/*.{jsx,js,tsx,ts}",
    }),
  ],
  build: {
    rollupOptions: {
      input: './index.html'
    }
  }
})
