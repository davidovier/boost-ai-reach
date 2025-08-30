import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import '@/styles/variables.scss'
import '@/styles/base.scss'
import '@/styles/layout.scss'
import './index.css'
import { preloadCriticalAssets, logBundleMetrics } from './utils/performance'

// Preload critical assets for better LCP
preloadCriticalAssets();

// Log performance metrics in development
if (import.meta.env.DEV) {
  logBundleMetrics();
}

createRoot(document.getElementById("root")!).render(<App />);
