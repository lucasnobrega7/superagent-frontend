'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { apiClient } from '@/app/lib/api-client'
import { Agent } from '@/app/lib/supabase'

export default function NewAgentPage() {
  const { user } = useUser()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Estado inicial do formulário
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
      setFormError('Você precisa estar logado para criar um agente')
      return
    }
    
    if (!formData.name || !formData.description) {
      setFormError('Nome e descrição são obrigatórios')
      return
    }
    
    try {
      setIsSubmitting(true)
      setFormError(null)
      
      const newAgent: Agent = {
        ...formData as Agent,
        user_id: user.id
      }
      
      const createdAgent = await apiClient.post<Agent>('/api/v1/agents', newAgent)
      
      // Redirecionar para a página de gerenciamento de conhecimento do agente
      router.push(`/dashboard/agents/${createdAgent.id}/knowledge`)
    } catch (err) {
      console.error('Erro ao criar agente:', err)
      setFormError('Falha ao criar o agente. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Criar Novo Agente</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Configure seu agente de IA com as capacidades desejadas
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

        <div className="flex justify-end space-x-3">
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
            {isSubmitting ? 'Criando...' : 'Criar Agente'}
          </button>
        </div>
      </form>
    </div>
  )
}