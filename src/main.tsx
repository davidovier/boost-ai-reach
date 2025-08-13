import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import '@/styles/variables.scss'
import '@/styles/base.scss'
import '@/styles/layout.scss'
import './index.css'

createRoot(document.getElementById("root")!).render(<App />);
