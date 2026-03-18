// PostCSS config used exclusively by vite.lib.config.ts during the library build.
// Tailwind processes @apply directives in CSS modules using the lib content paths.
module.exports = {
  plugins: {
    tailwindcss: { config: './tailwind.lib.config.js' },
  },
}
