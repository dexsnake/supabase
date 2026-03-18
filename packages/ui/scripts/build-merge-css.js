// Merges the two intermediate CSS files produced during the library build into
// the final dist/base.css that consumers import.
//
// Build pipeline:
//   1. vite build  → dist/base-components.css  (CSS modules, @apply expanded)
//   2. tailwindcss → dist/base-tw.css           (Tailwind utilities + design tokens)
//   3. this script → dist/base.css              (font-face + combined, intermediates deleted)
//
// Order: font-face first, then utilities, then component-specific rules.

const fs = require('fs')
const path = require('path')

const dist = path.resolve(__dirname, '../dist')
const srcFonts = path.resolve(__dirname, '../src/fonts')
const distFonts = path.join(dist, 'fonts')

// Copy font files to dist/fonts/ so the @font-face urls resolve correctly.
if (!fs.existsSync(distFonts)) fs.mkdirSync(distFonts, { recursive: true })
for (const file of fs.readdirSync(srcFonts)) {
  fs.copyFileSync(path.join(srcFonts, file), path.join(distFonts, file))
}

// @font-face declarations — URLs are relative to dist/base.css.
const fontFaceCss = `@font-face {
  font-family: 'custom-font';
  src: url('./fonts/CustomFont-Book.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'custom-font';
  src: url('./fonts/CustomFont-BookItalic.woff2') format('woff2');
  font-weight: 400;
  font-style: italic;
  font-display: swap;
}
@font-face {
  font-family: 'custom-font';
  src: url('./fonts/CustomFont-Medium.woff2') format('woff2');
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'custom-font';
  src: url('./fonts/CustomFont-Bold.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'custom-font';
  src: url('./fonts/CustomFont-BoldItalic.woff2') format('woff2');
  font-weight: 700;
  font-style: italic;
  font-display: swap;
}
@font-face {
  font-family: 'custom-font';
  src: url('./fonts/CustomFont-Black.woff2') format('woff2');
  font-weight: 800;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'custom-font';
  src: url('./fonts/CustomFont-BlackItalic.woff2') format('woff2');
  font-weight: 800;
  font-style: italic;
  font-display: swap;
}
/* Activate fonts via CSS variables, matching the design-system app's next/font setup. */
:root {
  --font-custom: 'custom-font', Circular, 'Helvetica Neue', Helvetica, Arial, sans-serif;
  --font-source-code-pro: 'Source Code Pro', 'Office Code Pro', Menlo, monospace;
}
`

const twPath = path.join(dist, 'base-tw.css')
const componentsPath = path.join(dist, 'base-components.css')
const outputPath = path.join(dist, 'base.css')

const tw = fs.existsSync(twPath) ? fs.readFileSync(twPath, 'utf8') : ''
const components = fs.existsSync(componentsPath) ? fs.readFileSync(componentsPath, 'utf8') : ''

fs.writeFileSync(outputPath, fontFaceCss + '\n' + tw + (components ? '\n' + components : ''))

if (fs.existsSync(twPath)) fs.rmSync(twPath)
if (fs.existsSync(componentsPath)) fs.rmSync(componentsPath)

console.log('dist/base.css written (%d bytes)', fs.statSync(outputPath).size)
