import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // ⚠️  CHANGE THIS to your actual GitHub repo name.
  // e.g. repo is  github.com/hix-001/piezo-power  →  base: '/piezo-power/'
  // If this is your user site  (username.github.io)  →  base: '/'
  base: 'https://github.com/Hix-001/Pizeoelectric_System',

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
