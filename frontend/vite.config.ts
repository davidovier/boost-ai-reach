import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Build configuration
  build: {
    outDir: 'build'
  },

  // Server configuration (platform expects these)
  server: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: true,
  },

  plugins: [
    react(),
    mode === 'development' &amp;&amp; componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));