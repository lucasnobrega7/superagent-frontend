'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function Home() {
  const [health, setHealth] = useState<{ status?: string, timestamp?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function checkApiHealth() {
      try {
        // Usar o proxy do Next.js com caminho relativo
        const response = await fetch('/health')
        const data = await response.json()
        setHealth(data)
        setLoading(false)
      } catch (err) {
        console.error('Erro ao verificar saúde da API:', err)
        setError('Não foi possível conectar à API. Verifique se o servidor backend está rodando.')
        setLoading(false)
      }
    }

    checkApiHealth()
  }, [])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Agentes de Conversão</h1>
      
      <div className="mb-12 max-w-2xl text-center">
        <p className="text-xl mb-4">
          Plataforma de agentes de IA para conversão
        </p>
      </div>
      
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Status da API:</h2>
        
        {loading ? (
          <p>Verificando conexão com a API...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <div className="p-4 bg-green-100 dark:bg-green-900 rounded-lg">
            <p><strong>Status:</strong> {health?.status}</p>
            <p><strong>Timestamp:</strong> {health?.timestamp}</p>
          </div>
        )}
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 mt-4 mb-8">
        <Link 
          href="/api-test" 
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-center"
        >
          Testar API
        </Link>
        <Link 
          href="/chat" 
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-center"
        >
          Testar Chat com Agente
        </Link>
      </div>
      
      <div className="flex gap-4 mt-8">
        <Link 
          href="/sign-in" 
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Entrar
        </Link>
        <Link 
          href="/sign-up" 
          className="px-6 py-3 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          Cadastrar
        </Link>
      </div>
    </main>
  )
}