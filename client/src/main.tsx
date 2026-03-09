import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AppProviders } from '@/app/providers/AppProviders'

// Minimal routing without react-router:
// keep the test UI accessible at `/test`.
if (window.location.pathname !== '/test') {
  window.history.replaceState(null, '', '/test')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
)
