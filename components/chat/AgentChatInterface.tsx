'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { apiClient } from '@/app/lib/api-client'
import { Agent } from '@/app/lib/supabase'
import ChatMonitoring from '../tracking/ChatMonitoring'

interface Message {
  id?: string
  role: 'user' | 'agent' | 'system'
  content: string
  thinking?: string | null
  sources?: any[]
  timestamp?: Date
}

interface ChatProps {
  preselectedAgentId?: string
  availableAgents?: Agent[]
}

export default function AgentChatInterface({ 
  preselectedAgentId, 
  availableAgents 
}: ChatProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoaded } = useUser()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Estado para agentes
  const [agents, setAgents] = useState<Agent[]>(availableAgents || [])
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(
    preselectedAgentId || searchParams?.get('agent') || null
  )
  const [loadingAgents, setLoadingAgents] = useState(!availableAgents)
  
  // Estado para mensagens
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Estado para exibição
  const [showThinking, setShowThinking] = useState(false)
  const [showSources, setShowSources] = useState(false)
  
  // Buscar agentes disponíveis se não fornecidos
  useEffect(() => {
    if (availableAgents || loadingAgents === false) return
    
    const fetchAgents = async () => {
      try {
        setLoadingAgents(true)
        const data = await apiClient.get<Agent[]>('/api/v1/agents')
        setAgents(data)
      } catch (err) {
        console.error('Erro ao carregar agentes:', err)
        setError('Falha ao carregar a lista de agentes')
      } finally {
        setLoadingAgents(false)
      }
    }
    
    fetchAgents()
  }, [availableAgents, loadingAgents])
  
  // Efeito para rolagem automática de mensagens
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  // Efeito para atualizar a URL quando o agente é selecionado
  useEffect(() => {
    if (selectedAgentId) {
      const url = new URL(window.location.href)
      url.searchParams.set('agent', selectedAgentId)
      router.replace(url.pathname + url.search)
    }
  }, [selectedAgentId, router])
  
  // Selecionar agente
  const handleSelectAgent = (agentId: string) => {
    if (agentId !== selectedAgentId) {
      setSelectedAgentId(agentId)
      setMessages([])
      setConversationId(null)
    }
  }
  
  // Enviar mensagem
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    
    if (!selectedAgentId) {
      setError('Por favor, selecione um agente para conversar')
      return
    }
    
    if (!input.trim()) return
    
    try {
      setIsLoading(true)
      setError(null)
      
      // Adicionar mensagem do usuário à interface
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: input,
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, userMessage])
      setInput('')
      
      // Enviar mensagem para o agente
      const response = await apiClient.post<{
        conversationId: string
        message: string
        thinking?: string
        sources?: any[]
        metadata?: any
        error?: string
      }>(`/api/v1/agents/${selectedAgentId}/chat`, {
        message: input,
        conversationId
      })
      
      // Salvar ID da conversa se for nova
      if (response.conversationId && !conversationId) {
        setConversationId(response.conversationId)
      }
      
      // Adicionar resposta do agente
      if (response.message) {
        const agentMessage: Message = {
          id: `agent-${Date.now()}`,
          role: 'agent',
          content: response.message,
          thinking: response.thinking || null,
          sources: response.sources || [],
          timestamp: new Date()
        }
        
        setMessages(prev => [...prev, agentMessage])
      }
      
      // Verificar erro
      if (response.error) {
        setError(`Erro: ${response.error}`)
      }
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err)
      setError('Falha ao enviar mensagem. Tente novamente.')
      
      // Adicionar mensagem de erro do sistema
      setMessages(prev => [
        ...prev,
        {
          id: `system-${Date.now()}`,
          role: 'system',
          content: 'Ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.',
          timestamp: new Date()
        }
      ])
    } finally {
      setIsLoading(false)
    }
  }
  
  // Limpar o chat
  const handleClearChat = () => {
    setMessages([])
    setConversationId(null)
  }
  
  // Renderizar mensagem
  const renderMessage = (message: Message, index: number) => {
    const isUserMessage = message.role === 'user'
    const isSystemMessage = message.role === 'system'
    
    return (
      <div 
        key={index} 
        className={`mb-4 ${isUserMessage ? 'ml-12' : isSystemMessage ? 'mx-12' : 'mr-12'}`}
      >
        <div 
          className={`p-4 rounded-lg ${
            isUserMessage 
            ? 'bg-blue-100 dark:bg-blue-900/30 ml-auto' 
            : isSystemMessage
            ? 'bg-gray-100 dark:bg-gray-800 text-center'
            : 'bg-gray-100 dark:bg-gray-800'
          }`}
        >
          {message.content}
          
          {/* Mostrar pensamento do agente se disponível e ativado */}
          {!isUserMessage && message.thinking && showThinking && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <details>
                <summary className="text-sm text-gray-500 dark:text-gray-400 cursor-pointer">
                  Processo de pensamento
                </summary>
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap bg-gray-50 dark:bg-gray-700/50 p-2 rounded">
                  {message.thinking}
                </div>
              </details>
            </div>
          )}
          
          {/* Mostrar fontes se disponíveis e ativadas */}
          {!isUserMessage && message.sources && message.sources.length > 0 && showSources && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <details>
                <summary className="text-sm text-gray-500 dark:text-gray-400 cursor-pointer">
                  {message.sources.length} {message.sources.length === 1 ? 'fonte' : 'fontes'}
                </summary>
                <div className="mt-2 space-y-2">
                  {message.sources.map((source, i) => (
                    <div key={i} className="text-xs bg-gray-50 dark:bg-gray-700/50 p-2 rounded">
                      {source.url ? (
                        <a 
                          href={source.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {source.title || source.url}
                        </a>
                      ) : (
                        <span>{source.title || 'Fonte ' + (i + 1)}</span>
                      )}
                      {source.text && (
                        <p className="mt-1 text-gray-600 dark:text-gray-300">{source.text}</p>
                      )}
                    </div>
                  ))}
                </div>
              </details>
            </div>
          )}
          
          {/* Mostrar horário da mensagem */}
          {message.timestamp && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
              {message.timestamp.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>
    )
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* Componente de rastreamento e monitoramento (invisível) */}
      <ChatMonitoring 
        agentId={selectedAgentId}
        conversationId={conversationId}
        messages={messages.map(msg => ({
          role: msg.role === 'agent' ? 'assistant' : msg.role,
          content: msg.content,
          id: msg.id,
          metadata: {
            thinking: msg.thinking,
            sources: msg.sources,
            timestamp: msg.timestamp
          }
        }))}
        userName={user?.fullName || user?.firstName || "Usuário"}
      />
      
      {/* Seleção de agente */}
      {agents.length > 0 && !preselectedAgentId && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <label htmlFor="agent-select" className="block text-sm font-medium mb-1">
            Selecione um agente para conversar:
          </label>
          <select
            id="agent-select"
            value={selectedAgentId || ''}
            onChange={(e) => handleSelectAgent(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="">Selecione um agente...</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name} {agent.is_public ? '(Público)' : ''}
              </option>
            ))}
          </select>
        </div>
      )}
      
      {/* Configurações e ações */}
      <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center text-sm">
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input 
              type="checkbox" 
              checked={showThinking} 
              onChange={() => setShowThinking(!showThinking)}
              className="mr-1"
            />
            Mostrar pensamento
          </label>
          <label className="flex items-center">
            <input 
              type="checkbox" 
              checked={showSources} 
              onChange={() => setShowSources(!showSources)}
              className="mr-1"
            />
            Mostrar fontes
          </label>
        </div>
        <button
          onClick={handleClearChat}
          className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
        >
          Limpar conversa
        </button>
      </div>
      
      {/* Mensagens */}
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-16 w-16 mb-4 text-gray-300 dark:text-gray-600" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
              />
            </svg>
            {selectedAgentId ? (
              <p>Envie uma mensagem para começar a conversar</p>
            ) : (
              <p>Selecione um agente para começar a conversar</p>
            )}
          </div>
        ) : (
          <>
            {messages.map((message, index) => renderMessage(message, index))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      
      {/* Barra de erro */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}
      
      {/* Entrada de mensagem */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading || !selectedAgentId}
            placeholder={
              !selectedAgentId
                ? "Selecione um agente primeiro"
                : isLoading
                ? "Aguardando resposta..."
                : "Digite sua mensagem aqui..."
            }
            className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim() || !selectedAgentId}
            className="px-4 py-2 bg-blue-600 text-white rounded-md 
                    hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Enviando...
              </span>
            ) : (
              "Enviar"
            )}
          </button>
        </form>
      </div>
    </div>
  )
}