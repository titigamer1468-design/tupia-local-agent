import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      include: "**/*.{jsx,js,tsx,ts}",
    }),
    // 🚨 REGISTRO INMEDIATO DE CABECERAS DE AISLAMIENTO PARA CLOUDFLARE ASSETS 🚨
    {
      name: 'inyectar-headers-cloudflare',
      closeBundle() {
        const fs = require('fs');
        const path = require('path');
        const dirDist = path.resolve(__dirname, 'dist');
        if (fs.existsSync(dirDist)) {
          const contenidoHeaders = `/*\n  Cross-Origin-Embedder-Policy: require-corp\n  Cross-Origin-Opener-Policy: same-origin\n`;
          fs.writeFileSync(path.join(dirDist, '_headers'), contenidoHeaders);
          console.log('✅ ¡Archivo _headers forzado con éxito dentro de dist/!');
        }
      }
    }
  ],
  server: {
    headers: {
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Opener-Policy": "same-origin",
    },
  },
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util']
  },
  build: {
    rollupOptions: {
      input: './index.html'
    }
  }
})
