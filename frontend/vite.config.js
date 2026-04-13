import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      }
    }
  },
  optimizeDeps: {
    // Optimize dependencies for faster builds
    exclude: ['__STATIC_CONTENT_MANIFEST']
  },
  build: {
    // Increase chunk size warning limit to 1MB
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Manual chunks configuration for better code splitting
        manualChunks: {
          // Vendor libraries
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // UI libraries
          'ui-vendor': ['ahooks'],
          // API and services
          'services': ['src/services', 'src/api', 'src/context'],
          // Components
          'components': ['src/components']
        }
      }
    }
  }
})
