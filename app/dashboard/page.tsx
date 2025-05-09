'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { logPageView, logUserAction, AnalyticsEvents } from '../lib/analytics'

export default function DashboardPage() {
  const { user } = useUser()
  const [agents, setAgents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const [stats, setStats] = useState({
    totalAgents: 0,
    totalChats: 0
  })
  
  useEffect(() => {
    async function fetchDashboardData() {
      setIsLoading(true)
      
      try {
        // Usar o proxy para comunicar com o backend
        const response = await fetch('/api/v1/agents')
        const agentsData = await response.json()
        setAgents(agentsData)
        
        // Atualizar estatísticas
        setStats({
          totalAgents: agentsData.length,
          totalChats: Math.floor(Math.random() * 10) // Mock para demonstração
        })
      } catch (error) {
        console.error('Erro ao buscar dados do dashboard:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchDashboardData()
    
    // Log page view for analytics
    logPageView('dashboard', {
      user_id: user?.id,
      has_agents: agents.length > 0
    })
    
    // Log user activity
    if (user) {
      logUserAction(AnalyticsEvents.DAILY_ACTIVE_USER, {
        user_id: user.id,
        email: user.emailAddresses?.[0]?.emailAddress
      })
    }
  }, [user?.id])
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
        <p>Bem-vindo(a) ao painel de controle, {user?.firstName || 'Usuário'}!</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card de estatísticas */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Estatísticas</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total de agentes</p>
              <p className="text-2xl font-bold">{stats.totalAgents}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Conversas</p>
              <p className="text-2xl font-bold">{stats.totalChats}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                <p className="font-medium">Online</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Card de ações rápidas */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Ações rápidas</h2>
          <div className="flex flex-col space-y-3">
            <Link
              href="/chat"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              onClick={() => logUserAction(AnalyticsEvents.CHAT_STARTED, { source: 'dashboard_quick_actions' })}
            >
              Iniciar nova conversa
            </Link>
            <Link
              href="/api-test"
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              Testar API
            </Link>
          </div>
        </div>
        
        {/* Card de agentes */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Seus agentes</h2>
            <Link
              href="/chat"
              className="inline-flex items-center text-sm px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800"
            >
              Chat
            </Link>
          </div>
          
          {isLoading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/5"></div>
            </div>
          ) : agents.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-500 dark:text-gray-400 mb-4">Nenhum agente disponível.</p>
              <button 
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                onClick={() => {
                  logUserAction('agent_creation_started', { source: 'dashboard' });
                  alert('Funcionalidade de criação de agente será implementada em breve!');
                }}
              >
                Criar agente
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {agents.map((agent) => (
                <div key={agent.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-750">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-lg">{agent.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{agent.description}</p>
                      <p className="text-xs text-gray-400 mt-1">ID: {agent.id}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Link
                        href={`/chat?agent=${agent.id}`}
                        className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        title="Chat com este agente"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Atividades recentes</h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <p>Nenhuma atividade recente.</p>
        </div>
      </div>
    </div>
  )
}