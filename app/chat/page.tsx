'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { apiClient } from '@/app/lib/api-client'
import { Agent } from '@/app/lib/supabase'
import AgentChatInterface from '@/components/chat/AgentChatInterface'

export default function ChatPage() {
  const searchParams = useSearchParams()
  const agentId = searchParams?.get('agent')
  
  const [agent, setAgent] = useState<Agent | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Carregar detalhes do agente se especificado na URL
  useEffect(() => {
    if (!agentId) return
    
    const fetchAgent = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const data = await apiClient.get<Agent>(`/api/v1/agents/${agentId}`)
        setAgent(data)
      } catch (err) {
        console.error('Erro ao carregar detalhes do agente:', err)
        setError('Não foi possível carregar as informações do agente')
      } finally {
        setLoading(false)
      }
    }
    
    fetchAgent()
  }, [agentId])
  
  return (
    <div className="flex flex-col h-screen">
      {/* Cabeçalho */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link 
              href="/"
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </Link>
            
            <h1 className="text-xl font-semibold">
              {loading ? (
                <span className="animate-pulse">Carregando...</span>
              ) : agent ? (
                <>Conversando com <span className="text-blue-600 dark:text-blue-400">{agent.name}</span></>
              ) : agentId ? (
                <>Agente não encontrado</>
              ) : (
                <>Chat com IA</>
              )}
            </h1>
          </div>
          
          <div>
            <Link
              href="/dashboard/agents"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Gerenciar agentes
            </Link>
          </div>
        </div>
      </header>
      
      {/* Área de chat */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {error ? (
          <div className="p-6 m-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
            <h2 className="text-lg font-semibold mb-2">Erro</h2>
            <p>{error}</p>
            <div className="mt-4">
              <Link
                href="/dashboard/agents"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Ver todos os agentes disponíveis
              </Link>
            </div>
          </div>
        ) : (
          <AgentChatInterface 
            preselectedAgentId={agentId || undefined}
          />
        )}
      </div>
    </div>
  )
}