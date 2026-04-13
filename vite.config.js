import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/Piezoelectric_System/',

  plugins: [react()],

  optimizeDeps: {
    include: ['three', '@react-three/fiber', '@react-three/drei', 'postprocessing'],
  },

  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          three:   ['three'],
          r3f:     ['@react-three/fiber', '@react-three/drei'],
          postpro: ['@react-three/postprocessing', 'postprocessing'],
          framer:  ['framer-motion'],
        },
      },
    },
  },
})
