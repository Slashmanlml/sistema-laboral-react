// `defineConfig` viene de vitest/config (no de vite) para que el bloque `test`
// se lea de verdad; con el de vite la clave se ignora y los tests corren sin jsdom.
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        // Chart.js sólo hace falta en Dashboard y Reportes; separarlo evita
        // arrastrar ~200 kB en el primer paint.
        manualChunks(id: string) {
          if (id.includes('chart.js') || id.includes('react-chartjs-2')) return 'charts'
          if (id.includes('@supabase')) return 'supabase'
          return undefined
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    css: false,
  },
})
