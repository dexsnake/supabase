// Tailwind config for the pre-built base bundle.
// Scans all base component source files so every utility class used in JSX
// or via @apply in CSS modules is included in dist/base.css.
const config = require('config/tailwind.config')

module.exports = config({
  content: ['./src/**/*.{tsx,ts,js}', './base.tsx'],
})
