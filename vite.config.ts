import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';
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
    // Service Worker for caching
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          },
          {
            urlPattern: /^https:\/\/api\.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 1 day
              }
            }
          }
        ]
      },
      manifest: {
        name: 'FindableAI',
        short_name: 'FindableAI',
        description: 'AI Findability Optimization Platform',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    }),
    // Bundle analyzer
    mode === 'analyze' && visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true
    })
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
    // Enable source maps for production debugging
    sourcemap: mode === 'development',
    // Target modern browsers for smaller bundles
    target: 'esnext',
    // Minify with SWC for better performance
    minify: 'esbuild',
    // Optimize chunks with enhanced strategy
    rollupOptions: {
      output: {
        // More granular chunk splitting
        manualChunks: (id) => {
          // React ecosystem
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
            return 'vendor-react';
          }
          
          // UI components - split by usage pattern
          if (id.includes('@radix-ui')) {
            if (id.includes('dialog') || id.includes('dropdown') || id.includes('popover')) {
              return 'ui-overlay';
            }
            if (id.includes('form') || id.includes('select') || id.includes('input')) {
              return 'ui-forms';
            }
            if (id.includes('table') || id.includes('tabs') || id.includes('accordion')) {
              return 'ui-data';
            }
            return 'ui-core';
          }
          
          // Heavy dependencies
          if (id.includes('recharts')) {
            return 'charts';
          }
          
          if (id.includes('lucide-react')) {
            return 'icons';
          }
          
          if (id.includes('@supabase')) {
            return 'supabase';
          }
          
          if (id.includes('date-fns')) {
            return 'utils-date';
          }
          
          // Admin-only components
          if (id.includes('/admin/') || id.includes('admin')) {
            return 'admin';
          }
          
          // Dashboard components
          if (id.includes('/dashboard/')) {
            return 'dashboard';
          }
          
          // Auth components
          if (id.includes('/auth/')) {
            return 'auth';
          }
          
          // Node modules (fallback)
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
        // Optimize chunk naming for caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop().replace('.tsx', '').replace('.ts', '')
            : 'chunk';
          return `js/${facadeModuleId}-[hash].js`;
        },
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `images/[name]-[hash].${ext}`;
          }
          if (/css/i.test(ext)) {
            return `css/[name]-[hash].${ext}`;
          }
          return `assets/[name]-[hash].${ext}`;
        },
      },
      // Tree shaking optimizations
      external: [],
      treeshake: {
        preset: 'recommended',
        manualPureFunctions: ['console.log', 'console.info', 'console.debug'],
      },
    },
    // Performance budgets
    chunkSizeWarningLimit: 500,
    assetsInlineLimit: 4096, // 4kb
  },
  // Enhanced dependency optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'lucide-react',
      'date-fns',
      'recharts/lib/component/ResponsiveContainer',
      'recharts/lib/chart/LineChart',
      'recharts/lib/chart/BarChart',
      'recharts/lib/component/XAxis',
      'recharts/lib/component/YAxis',
      'recharts/lib/component/CartesianGrid',
      'recharts/lib/component/Tooltip',
      'recharts/lib/component/Legend',
    ],
    exclude: ['@vite/client', '@vite/env'],
  },
  // CSS optimization
  css: {
    devSourcemap: mode === 'development',
    preprocessorOptions: {
      scss: {
        // Optimize SCSS compilation
        outputStyle: mode === 'production' ? 'compressed' : 'expanded',
      }
    }
  },
  // Experimental features for better performance
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
    legalComments: 'none',
  },
}));
