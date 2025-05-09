'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { apiClient } from '@/app/lib/api-client'
import { Agent, AgentKnowledgeItem } from '@/app/lib/supabase'

export default function AgentKnowledgePage({ params }: { params: { id: string } }) {
  const { user } = useUser()
  const router = useRouter()
  const agentId = params.id
  
  const [agent, setAgent] = useState<Agent | null>(null)
  const [knowledgeItems, setKnowledgeItems] = useState<AgentKnowledgeItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Estados para adicionar conhecimento
  const [isAddingKnowledge, setIsAddingKnowledge] = useState(false)
  const [newKnowledgeType, setNewKnowledgeType] = useState<'text' | 'url' | 'file'>('text')
  const [newKnowledgeContent, setNewKnowledgeContent] = useState('')
  const [newKnowledgeUrl, setNewKnowledgeUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Carregar dados do agente e seu conhecimento
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Buscar agente e conhecimento em paralelo
        const [agentData, knowledgeData] = await Promise.all([
          apiClient.get<Agent>(`/api/v1/agents/${agentId}`),
          apiClient.get<AgentKnowledgeItem[]>(`/api/v1/agents/${agentId}/knowledge`)
        ])
        
        setAgent(agentData)
        setKnowledgeItems(knowledgeData || [])
      } catch (err) {
        console.error('Erro ao carregar dados:', err)
        setError('Não foi possível carregar os dados do agente e seu conhecimento')
      } finally {
        setIsLoading(false)
      }
    }

    if (agentId) {
      fetchData()
    }
  }, [agentId])

  // Cancelar adição de conhecimento
  const handleCancelAdd = () => {
    setIsAddingKnowledge(false)
    setNewKnowledgeType('text')
    setNewKnowledgeContent('')
    setNewKnowledgeUrl('')
    setFile(null)
    setAddError(null)
    setUploadProgress(0)
  }
  
  // Lidar com seleção de arquivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      setFile(files[0])
    }
  }

  // Adicionar conhecimento de texto
  const handleAddTextKnowledge = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newKnowledgeContent.trim()) {
      setAddError('O conteúdo não pode estar vazio')
      return
    }
    
    try {
      setIsSubmitting(true)
      setAddError(null)
      
      const newItem: Partial<AgentKnowledgeItem> = {
        agent_id: agentId,
        content_type: 'text',
        content: newKnowledgeContent
      }
      
      const addedItem = await apiClient.post<AgentKnowledgeItem>(
        `/api/v1/agents/${agentId}/knowledge`, 
        newItem
      )
      
      // Adicionar à lista e fechar formulário
      setKnowledgeItems([addedItem, ...knowledgeItems])
      handleCancelAdd()
    } catch (err) {
      console.error('Erro ao adicionar conhecimento:', err)
      setAddError('Falha ao adicionar conhecimento. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Adicionar conhecimento de URL
  const handleAddUrlKnowledge = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newKnowledgeUrl.trim()) {
      setAddError('A URL não pode estar vazia')
      return
    }
    
    // Validar formato da URL
    try {
      new URL(newKnowledgeUrl) // Isso lançará um erro se a URL for inválida
    } catch (err) {
      setAddError('URL inválida. Certifique-se de incluir http:// ou https://')
      return
    }
    
    try {
      setIsSubmitting(true)
      setAddError(null)
      
      const newItem: Partial<AgentKnowledgeItem> = {
        agent_id: agentId,
        content_type: 'url',
        content: newKnowledgeUrl
      }
      
      const addedItem = await apiClient.post<AgentKnowledgeItem>(
        `/api/v1/agents/${agentId}/knowledge`, 
        newItem
      )
      
      // Adicionar à lista e fechar formulário
      setKnowledgeItems([addedItem, ...knowledgeItems])
      handleCancelAdd()
    } catch (err) {
      console.error('Erro ao adicionar conhecimento:', err)
      setAddError('Falha ao adicionar conhecimento. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Adicionar conhecimento por arquivo
  const handleAddFileKnowledge = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!file) {
      setAddError('Selecione um arquivo para upload')
      return
    }
    
    try {
      setIsSubmitting(true)
      setAddError(null)
      setUploadProgress(10)
      
      // Criar FormData para upload de arquivo
      const formData = new FormData()
      formData.append('file', file)
      
      setUploadProgress(30)
      
      // Usar uma interface diferente para upload de arquivo
      const response = await fetch(`/api/v1/agents/${agentId}/knowledge/upload`, {
        method: 'POST',
        body: formData
      })
      
      setUploadProgress(90)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao fazer upload do arquivo')
      }
      
      const addedItem = await response.json()
      setUploadProgress(100)
      
      // Adicionar à lista e fechar formulário
      setKnowledgeItems([addedItem, ...knowledgeItems])
      handleCancelAdd()
    } catch (err) {
      console.error('Erro ao adicionar arquivo:', err)
      setAddError('Falha ao fazer upload do arquivo. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Remover item de conhecimento
  const handleDeleteKnowledge = async (itemId: string) => {
    if (!confirm('Tem certeza que deseja remover este conhecimento?')) {
      return
    }
    
    try {
      await apiClient.delete(`/api/v1/agents/${agentId}/knowledge/${itemId}`)
      
      // Atualizar lista
      setKnowledgeItems(knowledgeItems.filter(item => item.id !== itemId))
      
      // Mostrar mensagem de sucesso
      alert('Item de conhecimento removido com sucesso!')
    } catch (err) {
      console.error('Erro ao remover conhecimento:', err)
      alert('Falha ao remover conhecimento')
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
        </div>
      </div>
    )
  }

  // Renderizar mensagem de erro
  if (error || !agent) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
          <p>{error || 'Agente não encontrado'}</p>
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

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <Link 
          href="/dashboard/agents"
          className="mr-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{agent.name}</h1>
          <p className="text-gray-500 dark:text-gray-400">Gerenciamento de Conhecimento</p>
        </div>
      </div>

      {!isAddingKnowledge ? (
        <div className="mb-6 flex justify-between items-center">
          <p>
            Gerencie o conhecimento que o agente usará ao responder perguntas.
          </p>
          <button
            onClick={() => setIsAddingKnowledge(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Adicionar Conhecimento
          </button>
        </div>
      ) : (
        <div className="mb-8 bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Adicionar Conhecimento</h2>
            <button
              onClick={handleCancelAdd}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {addError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
              {addError}
            </div>
          )}

          <div className="mb-4">
            <div className="flex space-x-4 mb-4">
              <button
                onClick={() => setNewKnowledgeType('text')}
                className={`px-4 py-2 rounded-md ${
                  newKnowledgeType === 'text'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Texto
              </button>
              <button
                onClick={() => setNewKnowledgeType('url')}
                className={`px-4 py-2 rounded-md ${
                  newKnowledgeType === 'url'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                URL / Site
              </button>
              <button
                onClick={() => setNewKnowledgeType('file')}
                className={`px-4 py-2 rounded-md ${
                  newKnowledgeType === 'file'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Arquivo
              </button>
            </div>

            {newKnowledgeType === 'text' ? (
              <form onSubmit={handleAddTextKnowledge}>
                <div className="mb-4">
                  <label htmlFor="content" className="block text-sm font-medium mb-1">
                    Conteúdo
                  </label>
                  <textarea
                    id="content"
                    value={newKnowledgeContent}
                    onChange={(e) => setNewKnowledgeContent(e.target.value)}
                    rows={8}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Insira o texto que o agente deve conhecer..."
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Adicione textos que deseja que o agente possa referenciar ao responder perguntas.
                  </p>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 
                               disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Adicionando...' : 'Adicionar'}
                  </button>
                </div>
              </form>
            ) : newKnowledgeType === 'url' ? (
              <form onSubmit={handleAddUrlKnowledge}>
                <div className="mb-4">
                  <label htmlFor="url" className="block text-sm font-medium mb-1">
                    URL
                  </label>
                  <input
                    id="url"
                    type="url"
                    value={newKnowledgeUrl}
                    onChange={(e) => setNewKnowledgeUrl(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="https://exemplo.com/artigo"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Adicione URLs de sites ou artigos que o agente deve conhecer. O conteúdo será extraído e processado.
                  </p>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 
                               disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Adicionando...' : 'Adicionar'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleAddFileKnowledge}>
                <div className="mb-4">
                  <label htmlFor="file" className="block text-sm font-medium mb-1">
                    Arquivo
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                        aria-hidden="true"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H8m36-12h-4m4 0H20"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="flex text-sm text-gray-600 dark:text-gray-400">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer bg-white dark:bg-gray-700 rounded-md font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 focus-within:outline-none"
                        >
                          <span>Selecione um arquivo</span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            className="sr-only"
                            onChange={handleFileChange}
                          />
                        </label>
                        <p className="pl-1">ou arraste e solte</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        PDF, DOC, TXT, CSV, JSON, MD, imagens, áudio e vídeo (max. 10MB)
                      </p>
                      {file && (
                        <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                          Arquivo selecionado: {file.name}
                        </p>
                      )}
                    </div>
                  </div>
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 text-right">
                        {uploadProgress}%
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting || !file}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 
                               disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Fazendo upload...' : 'Fazer Upload'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xl font-semibold mb-4">Base de Conhecimento</h2>
        
        {knowledgeItems.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6 border border-gray-200 dark:border-gray-700 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              Este agente ainda não possui itens de conhecimento.
            </p>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Adicione conhecimento para melhorar as respostas do agente.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {knowledgeItems.map((item) => (
              <div 
                key={item.id}
                className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-4 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center">
                    {item.content_type === 'text' ? (
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </span>
                    ) : item.content_type === 'url' ? (
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      </span>
                    ) : (
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </span>
                    )}
                    <span className="text-sm font-medium">
                      {item.content_type === 'text' ? 'Texto' : 
                       item.content_type === 'url' ? 'URL' : 'Arquivo'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteKnowledge(item.id!)}
                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    title="Remover"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                
                <div className="mt-3 pl-11">
                  {item.content_type === 'text' ? (
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded border border-gray-200 dark:border-gray-600 text-sm max-h-32 overflow-y-auto">
                      {item.content}
                    </div>
                  ) : item.content_type === 'url' ? (
                    <a 
                      href={item.content} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline dark:text-blue-400 break-all"
                    >
                      {item.content}
                    </a>
                  ) : (
                    <div className="text-sm">
                      {item.file_name || 'Arquivo'}
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500 mt-2">
                    Adicionado em {new Date(item.created_at!).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-between">
        <Link
          href={`/dashboard/agents/${agentId}`}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                    text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Voltar para Edição
        </Link>
        
        <Link
          href={`/chat?agent=${agentId}`}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          Testar Agente
        </Link>
      </div>
    </div>
  )
}