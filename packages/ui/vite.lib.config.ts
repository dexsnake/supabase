import { resolve } from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Types are served from the source base.tsx file directly (via exports["./base"].types).
// No separate .d.ts generation is needed.

export default defineConfig({
  plugins: [react()],

  css: {
    // Point Vite at the package directory so it finds postcss.config.js here.
    // This ensures @apply directives in CSS modules are expanded by Tailwind
    // during the lib build.
    postcss: resolve(__dirname, '.'),
  },

  build: {
    lib: {
      entry: resolve(__dirname, 'base.tsx'),
      formats: ['es'],
      fileName: () => 'base.js',
    },
    rollupOptions: {
      // Externalize every package-level import so the bundle only contains
      // the UI component code itself. All runtime deps are provided by the
      // consuming app (resolved via pnpm workspace hoisting).
      external: (id) =>
        !id.startsWith('.') && !id.startsWith('/') && !id.startsWith('\0'),
      output: {
        // Name the extracted CSS distinctly so the merge script can find it.
        assetFileNames: 'base-components[extname]',
      },
    },
    // All CSS (CSS modules + any imported CSS) lands in a single file.
    cssCodeSplit: false,
  },
})
