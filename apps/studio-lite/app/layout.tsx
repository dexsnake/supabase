import { ThemeProvider } from 'next-themes'
import { customFont, sourceCodePro } from '../fonts'
import 'react-data-grid/lib/styles.css'
import './globals.css'

export const metadata = {
  title: 'Supalite Studio',
  description: 'Lightweight database dashboard for Supalite',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `:root{--font-custom:${customFont.style.fontFamily};--font-source-code-pro:${sourceCodePro.style.fontFamily};}`,
          }}
        />
      </head>
      <body className={`${customFont.variable} ${sourceCodePro.variable} font-sans`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
