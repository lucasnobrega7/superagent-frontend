'use client'

import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { useEffect } from 'react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isLoaded, isSignedIn, user } = useUser()
  const router = useRouter()
  
  // Redirecionar para login se não estiver autenticado
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in')
    }
  }, [isLoaded, isSignedIn, router])
  
  // Mostrar tela de carregamento enquanto verifica autenticação
  if (!isLoaded || !isSignedIn) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Verificando autenticação...</h2>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">Agentes de Conversão</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm">
                Olá, {user?.firstName || user?.username || 'Usuário'}
              </span>
              <img 
                src={user?.imageUrl || 'https://ui-avatars.com/api/?name=' + (user?.firstName || 'User')} 
                alt="Avatar" 
                className="h-8 w-8 rounded-full"
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </div>
    </div>
  )
}