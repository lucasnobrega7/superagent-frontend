import './globals.css'
import './fixes.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Superagent with LiteralAI',
  description: 'A Superagent implementation with LiteralAI tracking',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <main className="min-h-screen w-full max-w-full">
          {children}
        </main>
      </body>
    </html>
  )
}