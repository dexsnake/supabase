// Full export: everything in base plus Next.js-specific components.
// Existing apps import from this entry (unchanged behaviour).
//
// To add a new export:
//   - If it does NOT import from next/*, add it to base.tsx
//   - If it DOES import from next/*, add it here only

export * from './base'

// Next.js-specific components
export * from './src/lib/Markdown'
export * from './src/components/Image'
export * from './src/components/TextLink'
export * from './src/layout/banners'
