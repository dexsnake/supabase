// Ambient declarations needed when TypeScript follows source files from packages/ui.

declare module '*.css' {
  const styles: Record<string, string>
  export default styles
}

declare module 'highlightjs-curl' {
  const languageFunc: unknown
  export = languageFunc
}
