// PostCSS config for packages/ui.
// Used by both:
//   - `pnpm build` (vite.lib.config.ts): expands @apply in CSS modules for the
//     pre-built base bundle, and generates Tailwind utilities for base-styles.css
//   - `pnpm test` (vitest): expands @apply so CSS modules compile correctly in jsdom
module.exports = {
  plugins: {
    tailwindcss: { config: './tailwind.lib.config.js' },
  },
}
