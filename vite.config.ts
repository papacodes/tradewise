import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";

// https://vite.dev/config/
export default defineConfig({
  // Aggressive cache busting for development
  define: {
    __BUILD_TIME__: JSON.stringify(Date.now()),
  },
  build: {
    // Add timestamp to asset names for cache busting
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name]-[hash]-${Date.now()}.js`,
        chunkFileNames: `assets/[name]-[hash]-${Date.now()}.js`,
        assetFileNames: `assets/[name]-[hash]-${Date.now()}.[ext]`,
        // Manual chunking to optimize bundle size
        manualChunks: {
          // React and core libraries
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Chart libraries (large dependencies)
          'chart-vendor': ['recharts', 'd3-scale', 'd3-array', 'd3-time', 'd3-time-format'],
          // UI libraries
          'ui-vendor': ['lucide-react', 'sonner'],
          // Form and validation libraries
          'form-vendor': ['zod', 'react-hook-form'],
          // Supabase and auth
          'supabase-vendor': ['@supabase/supabase-js'],
          // Utility libraries
          'utils-vendor': ['date-fns', 'clsx']
        }
      }
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000
  },
  plugins: [
    react(),
    tsconfigPaths(),
  ],
  server: {
    // Disable caching in development
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', () => {
            console.log('Proxy error');
          });
          proxy.on('proxyReq', () => {
            console.log('Proxy request');
          });
          proxy.on('proxyRes', () => {
            console.log('Proxy response');
          });
        },
      }
    }
  }
})
