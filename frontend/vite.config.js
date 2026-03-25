import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Increase asset limit so the data JSON is inlined or served properly
  build: {
    assetsInlineLimit: 0,
  },
})
