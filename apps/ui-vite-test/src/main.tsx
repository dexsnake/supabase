import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from 'next-themes'
// Pre-built CSS: design tokens + Tailwind utilities + component CSS modules.
// No Tailwind config needed in this app.
import 'ui/base.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider attribute="data-theme" defaultTheme="dark">
      <App />
    </ThemeProvider>
  </StrictMode>
)
