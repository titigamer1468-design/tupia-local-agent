import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      include: "**/*.{jsx,js,tsx,ts}",
    }),
  ],
  // 🚨 CONFIGURACIÓN MAESTRA DE SERVIDOR PARA AUDIO/VIDEO LOCAL NATIVO WASM 🚨
  server: {
    headers: {
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Opener-Policy": "same-origin",
    },
  },
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util']
  },
  // Aseguramos que Vite no intente alterar ni pre-compilar los binarios WASM locales de /public
  build: {
    rollupOptions: {
      input: './index.html'
    }
  }
})
