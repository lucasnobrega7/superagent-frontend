'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { apiClient } from '@/app/lib/api-client'
import SuperagentManager from '../../../components/superagent/SuperagentManager'

interface ConnectionStatus {
  status: 'success' | 'error'
  connection: {
    baseUrl: string
    hasApiKey: boolean
    isAuthenticated: boolean
    online: boolean
    version?: string
    message: string
    error?: string
  }
}

export default function SuperagentStatusPage() {
  const [status, setStatus] = useState<ConnectionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFirebaseIntegration, setShowFirebaseIntegration] = useState(false)
  
  // Verificar status da conexão com o Superagent
  useEffect(() => {
    const checkStatus = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const data = await apiClient.get<ConnectionStatus>('/api/v1/superagent/status')
        setStatus(data)
      } catch (err) {
        console.error('Erro ao verificar status do Superagent:', err)
        setError('Não foi possível verificar o status da conexão com o Superagent')
      } finally {
        setLoading(false)
      }
    }
    
    checkStatus()
  }, [])
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Status do Superagent</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Verifique o status da conexão com a API do Superagent
          </p>
        </div>
        
        <Link
          href="/dashboard/agents"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          Voltar para Agentes
        </Link>
      </div>
      
      {loading ? (
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-8 border border-gray-200 dark:border-gray-700 text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-500 dark:text-gray-400">Verificando conexão com o Superagent...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 shadow-sm rounded-lg p-6 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400">
          <h2 className="text-lg font-semibold mb-2">Erro</h2>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Tentar novamente
          </button>
        </div>
      ) : status ? (
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Status da Conexão</h2>
              <span 
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  status.connection.online
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                }`}
              >
                {status.connection.online ? 'Online' : 'Offline'}
              </span>
            </div>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              {status.connection.message}
            </p>
            {status.connection.error && (
              <p className="mt-2 text-red-600 dark:text-red-400">
                Erro: {status.connection.error}
              </p>
            )}
          </div>
          
          <div className="p-6">
            <h3 className="text-lg font-medium mb-4">Detalhes da Configuração</h3>
            <div className="space-y-3">
              <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded">
                <div className="text-sm font-medium">URL da API</div>
                <div className="mt-1 text-gray-700 dark:text-gray-300 font-mono text-sm break-all">
                  {status.connection.baseUrl}
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded">
                <div className="text-sm font-medium">Chave de API</div>
                <div className="mt-1 flex items-center">
                  {status.connection.hasApiKey ? (
                    <div className="flex items-center text-green-600 dark:text-green-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Configurada
                    </div>
                  ) : (
                    <div className="flex items-center text-red-600 dark:text-red-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      Não configurada
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded">
                <div className="text-sm font-medium">Autenticação</div>
                <div className="mt-1 flex items-center">
                  {status.connection.isAuthenticated ? (
                    <div className="flex items-center text-green-600 dark:text-green-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Autenticado
                    </div>
                  ) : (
                    <div className="flex items-center text-yellow-600 dark:text-yellow-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Não autenticado
                    </div>
                  )}
                </div>
              </div>
              
              {status.connection.version && (
                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded">
                  <div className="text-sm font-medium">Versão da API</div>
                  <div className="mt-1 text-gray-700 dark:text-gray-300">
                    {status.connection.version}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="p-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-end">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Atualizar Status
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 shadow-sm rounded-lg p-6 border border-yellow-200 dark:border-yellow-800 text-yellow-600 dark:text-yellow-400">
          <h2 className="text-lg font-semibold mb-2">Sem dados</h2>
          <p>Não foi possível obter informações sobre o status da conexão com o Superagent.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
          >
            Tentar novamente
          </button>
        </div>
      )}
      
      <div className="mt-6 bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold mb-4">Ferramentas de Diagnóstico</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-md font-medium mb-2">Testar Chat</h3>
            <Link
              href="/chat"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 inline-block mr-3"
            >
              Abrir Interface de Chat
            </Link>
            <button
              onClick={() => setShowFirebaseIntegration(!showFirebaseIntegration)}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 inline-block"
            >
              {showFirebaseIntegration ? 'Ocultar Firebase' : 'Mostrar Firebase'}
            </button>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Teste a comunicação com os agentes através da interface de chat ou utilize a integração com Firebase.
            </p>
          </div>
          
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-md font-medium mb-2">Configuração do Ambiente</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Certifique-se de que as seguintes variáveis de ambiente estão configuradas:
            </p>
            <ul className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-300 list-disc list-inside">
              <li>NEXT_PUBLIC_SUPERAGENT_API_URL</li>
              <li>NEXT_PUBLIC_SUPERAGENT_API_KEY</li>
              <li>NEXT_PUBLIC_FIREBASE_API_KEY</li>
              <li>NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN</li>
              <li>NEXT_PUBLIC_FIREBASE_PROJECT_ID</li>
            </ul>
          </div>
          
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-md font-medium mb-2">Documentação</h3>
            <div className="flex space-x-4">
              <a
                href="https://docs.superagent.sh"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Documentação do Superagent
              </a>
              <a
                href="https://github.com/homanp/superagent"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                GitHub do Superagent
              </a>
              <a
                href="https://firebase.google.com/docs/functions"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Firebase Functions
              </a>
            </div>
          </div>
        </div>
      </div>
      
      {showFirebaseIntegration && (
        <div className="mt-6 bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold">Firebase + Superagent</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Integração entre Firebase Cloud Functions e Superagent API
            </p>
          </div>
          <SuperagentManager />
        </div>
      )}
    </div>
  )
}