import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import '@/styles/variables.scss'
import '@/styles/base.scss'
import '@/styles/layout.scss'
import './index.css'
// Development performance logging
if (import.meta.env.DEV) {
  console.log('Development mode - performance monitoring available');
}

createRoot(document.getElementById("root")!).render(<App />);
