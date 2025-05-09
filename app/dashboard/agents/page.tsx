'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { apiClient } from '@/app/lib/api-client'
import { Agent } from '@/app/lib/supabase'

export default function AgentsPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [agents, setAgents] = useState<Agent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Carregar agentes na inicialização
  useEffect(() => {
    if (!isLoaded) return

    const fetchAgents = async () => {
      try {
        setIsLoading(true)
        const data = await apiClient.get<Agent[]>('/api/v1/agents')
        setAgents(data)
        setError(null)
      } catch (err) {
        console.error('Erro ao carregar agentes:', err)
        setError('Falha ao carregar a lista de agentes')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAgents()
  }, [isLoaded])

  // Função para excluir um agente
  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm('Tem certeza que deseja excluir este agente?')) {
      return
    }

    try {
      await apiClient.delete(`/api/v1/agents/${agentId}`)
      
      // Atualizar lista de agentes
      setAgents(agents.filter(agent => agent.id !== agentId))
      
      // Mostrar mensagem de sucesso
      alert('Agente excluído com sucesso!')
    } catch (err) {
      console.error('Erro ao excluir agente:', err)
      alert('Falha ao excluir agente')
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gerenciar Agentes</h1>
        <Link 
          href="/dashboard/agents/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Criar Novo Agente
        </Link>
      </div>

      {isLoading ? (
        <div className="py-8 flex justify-center">
          <div className="animate-pulse space-y-4 w-full max-w-4xl">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg w-full"></div>
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
          <p>{error}</p>
          <button 
            onClick={() => router.refresh()}
            className="mt-2 text-sm underline"
          >
            Tentar novamente
          </button>
        </div>
      ) : agents.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">Você ainda não criou nenhum agente.</p>
          <Link 
            href="/dashboard/agents/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Criar seu primeiro agente
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {agents.map(agent => (
            <div 
              key={agent.id} 
              className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold">{agent.name}</h2>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">{agent.description}</p>
                  <div className="flex items-center mt-2">
                    <span className={`w-2 h-2 rounded-full mr-2 ${agent.is_public ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                    <span className="text-sm">{agent.is_public ? 'Público' : 'Privado'}</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Link
                    href={`/chat?agent=${agent.id}`}
                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                    title="Chat com este agente"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </Link>
                  <Link
                    href={`/dashboard/agents/${agent.id}`}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded"
                    title="Editar agente"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </Link>
                  <button
                    onClick={() => handleDeleteAgent(agent.id!)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    title="Excluir agente"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                    ID: {agent.id}
                  </span>
                  <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                    Criado: {new Date(agent.created_at!).toLocaleDateString()}
                  </span>
                  {agent.config?.llm && (
                    <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded">
                      LLM: {agent.config.llm}
                    </span>
                  )}
                  {agent.config?.tools && agent.config.tools.length > 0 && (
                    <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded">
                      Ferramentas: {agent.config.tools.length}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <Link
                  href={`/dashboard/agents/${agent.id}/knowledge`}
                  className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Gerenciar conhecimento →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}