import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    css: false,
  },
  build: {
    // Enable source maps for development debugging
    sourcemap: mode === 'development',
    // Target modern browsers for smaller bundles
    target: 'esnext',
    // Minify with SWC for better performance
    minify: 'esbuild',
    // Basic chunk splitting for better performance
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React ecosystem
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
            return 'vendor-react';
          }
          
          // UI components
          if (id.includes('@radix-ui')) {
            return 'ui-components';
          }
          
          // Charts
          if (id.includes('recharts')) {
            return 'charts';
          }
          
          // Icons
          if (id.includes('lucide-react')) {
            return 'icons';
          }
          
          // Supabase
          if (id.includes('@supabase')) {
            return 'supabase';
          }
          
          // Node modules (fallback)
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
    // Performance budgets
    chunkSizeWarningLimit: 500,
  },
  // Basic dependency optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'lucide-react',
      'date-fns',
    ],
  },
}));