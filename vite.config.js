import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Ensure this matches your NEW repo name exactly
  base: '/Piezoelectric_System/', 

  plugins: [react()],

  build: {
    outDir: 'dist',
    sourcemap: false,
    // Removed rollupOptions and manualChunks to fix the build error
  },
})