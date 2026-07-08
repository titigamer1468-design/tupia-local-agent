import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // El puerto estándar de Vite
    open: true, // Abre el navegador automáticamente cuando arrancas el servidor
  },
  build: {
    // Configuración estándar por si decides compilarlo para producción
    outDir: 'dist',
  }
})
