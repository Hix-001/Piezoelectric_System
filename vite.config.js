import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/Piezoelectric_System/',
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    // We are removing the manualChunks object to satisfy Vite 8 requirements
  },
})