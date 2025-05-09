'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { apiClient } from '@/app/lib/api-client'
import { Agent } from '@/app/lib/supabase'

export default function EditAgentPage({ params }: { params: { id: string } }) {
  const { user } = useUser()
  const router = useRouter()
  const agentId = params.id
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  // Estado do formulário
  const [formData, setFormData] = useState<Partial<Agent> & {config: any}>({
    name: '',
    description: '',
    is_public: false,
    config: {
      llm: 'gpt-4o',
      temperature: 0.7,
      tools: []
    }
  })

  // Carregar dados do agente
  useEffect(() => {
    const fetchAgent = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const agent = await apiClient.get<Agent>(`/api/v1/agents/${agentId}`)
        
        // Preencher formulário com dados do agente
        setFormData({
          name: agent.name,
          description: agent.description,
          is_public: agent.is_public || false,
          avatar_url: agent.avatar_url,
          config: agent.config || {
            llm: 'gpt-4o',
            temperature: 0.7,
            tools: []
          }
        })
      } catch (err) {
        console.error('Erro ao carregar agente:', err)
        setError('Não foi possível carregar os dados do agente')
      } finally {
        setIsLoading(false)
      }
    }

    if (agentId) {
      fetchAgent()
    }
  }, [agentId])

  // Atualizar campo do formulário
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: (e.target as HTMLInputElement).checked
      })
    } else {
      setFormData({
        ...formData,
        [name]: value
      })
    }
  }

  // Atualizar configuração do LLM
  const handleLLMConfigChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    setFormData({
      ...formData,
      config: {
        ...formData.config,
        [name]: type === 'number' ? parseFloat(value) : value
      }
    })
  }

  // Enviar formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      setFormError('Você precisa estar logado para editar um agente')
      return
    }
    
    if (!formData.name || !formData.description) {
      setFormError('Nome e descrição são obrigatórios')
      return
    }
    
    try {
      setIsSubmitting(true)
      setFormError(null)
      
      // Enviar apenas os campos atualizáveis
      const updates = {
        name: formData.name,
        description: formData.description,
        is_public: formData.is_public,
        config: formData.config
      }
      
      await apiClient.put<Agent>(`/api/v1/agents/${agentId}`, updates)
      
      // Mostrar mensagem de sucesso e redirecionar
      alert('Agente atualizado com sucesso!')
      router.push('/dashboard/agents')
    } catch (err) {
      console.error('Erro ao atualizar agente:', err)
      setFormError('Falha ao atualizar o agente. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Renderizar tela de carregamento
  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  // Renderizar mensagem de erro
  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
          <p>{error}</p>
          <div className="mt-4">
            <button 
              onClick={() => router.push('/dashboard/agents')}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-red-300 dark:border-red-700 rounded-md text-red-600 dark:text-red-400"
            >
              Voltar para lista de agentes
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Renderizar formulário
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Editar Agente</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Atualize as configurações do seu agente de IA
        </p>
      </div>

      {formError && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Informações Básicas</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Nome do Agente
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="Ex: Assistente de Marketing"
                required
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-1">
                Descrição
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="Descreva o que este agente faz e para quais tarefas ele é especializado"
                required
              />
            </div>
            
            <div className="flex items-center">
              <input
                id="is_public"
                name="is_public"
                type="checkbox"
                checked={formData.is_public}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 
                           border-gray-300 dark:border-gray-600 rounded"
              />
              <label htmlFor="is_public" className="ml-2 block text-sm">
                Tornar este agente público (acessível a todos os usuários)
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Configuração do Modelo</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="llm" className="block text-sm font-medium mb-1">
                Modelo de Linguagem
              </label>
              <select
                id="llm"
                name="llm"
                value={formData.config.llm}
                onChange={handleLLMConfigChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="gpt-4o">GPT-4o</option>
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                <option value="claude-3-opus">Claude 3 Opus</option>
                <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                <option value="claude-3-haiku">Claude 3 Haiku</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="temperature" className="block text-sm font-medium mb-1">
                Temperatura: {formData.config.temperature}
              </label>
              <input
                id="temperature"
                name="temperature"
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={formData.config.temperature}
                onChange={handleLLMConfigChange}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Mais preciso</span>
                <span>Mais criativo</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          <div>
            <button
              type="button"
              onClick={() => router.push(`/dashboard/agents/${agentId}/knowledge`)}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              Gerenciar Conhecimento
            </button>
          </div>
          
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => router.push('/dashboard/agents')}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                         text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}