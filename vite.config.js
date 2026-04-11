import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          lucide: ['lucide-react'],
          date: ['date-fns'],
          db: ['dexie', '@supabase/supabase-js']
        }
      }
    },
    chunkSizeWarningLimit: 800
  }
})
