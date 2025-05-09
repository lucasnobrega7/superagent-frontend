import { ClerkProvider } from '@clerk/nextjs'
import { Inter } from 'next/font/google'
import './globals.css'
import SentryInit from './sentry-init'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Agentes de Conversão',
  description: 'Plataforma de agentes de IA para conversão',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider
      appearance={{
        variables: { colorPrimary: '#6366f1' },
      }}
    >
      <html lang="pt-BR">
        <body className={inter.className}>
          <SentryInit />
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}