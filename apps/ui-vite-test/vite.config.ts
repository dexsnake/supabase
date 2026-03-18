import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// No Tailwind or PostCSS needed — all CSS comes pre-built from ui/base.css.
export default defineConfig({
  plugins: [react()],
})
