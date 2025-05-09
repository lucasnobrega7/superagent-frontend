'use client'

import { useState, useEffect } from 'react'
import ApiFunctionsClient from '@/app/lib/api-functions-client'
import { Agent } from '@/app/lib/api-functions-client'

export default function ApiTestPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [corsInfo, setCorsInfo] = useState<string | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [healthStatus, setHealthStatus] = useState<{status: string, timestamp: string} | null>(null);
  const [agentData, setAgentData] = useState({
    name: '',
    description: '',
    isPublic: false
  });

  // Testar listagem de agentes
  const testListAgents = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await ApiFunctionsClient.listAgents();
      setResult(result);
      setAgents(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  // Testar criação de agente
  const testCreateAgent = async () => {
    if (!agentData.name || !agentData.description) {
      setError('Nome e descrição são obrigatórios');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await ApiFunctionsClient.createAgent(agentData);
      setResult(result);
      // Atualizar a lista de agentes após a criação
      testListAgents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  // Testar dados analíticos
  const testAnalyticsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await ApiFunctionsClient.getAnalyticsData();
      setResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  // Testar API externa
  const testExternalApi = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await ApiFunctionsClient.testExternalApi();
      setResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  // Testar função básica Hello World
  const testHelloWorld = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await ApiFunctionsClient.helloWorld();
      setResult(result);
      setHealthStatus({
        status: "online",
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        // Testar a conexão com Hello World
        await testHelloWorld();
        // Carregar a lista de agentes
        await testListAgents();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center p-12">
      <h1 className="text-3xl font-bold mb-8">Teste de API Firebase</h1>

      <div className="flex space-x-4 mb-8">
        <button 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={testHelloWorld}
          disabled={loading}
        >
          Testar Hello World
        </button>
        <button 
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          onClick={testListAgents}
          disabled={loading}
        >
          Listar Agentes
        </button>
        <button 
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          onClick={testExternalApi}
          disabled={loading}
        >
          Testar API Externa
        </button>
        <button 
          className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
          onClick={testAnalyticsData}
          disabled={loading}
        >
          Dados Analíticos
        </button>
      </div>

      <div className="w-full max-w-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Criar Novo Agente</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nome</label>
            <input
              type="text"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              value={agentData.name}
              onChange={(e) => setAgentData({...agentData, name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Descrição</label>
            <textarea
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              value={agentData.description}
              onChange={(e) => setAgentData({...agentData, description: e.target.value})}
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              checked={agentData.isPublic}
              onChange={(e) => setAgentData({...agentData, isPublic: e.target.checked})}
            />
            <label className="ml-2 block text-sm text-gray-700">Público</label>
          </div>
          <button 
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={testCreateAgent}
            disabled={loading}
          >
            Criar Agente
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center">
          <p className="text-xl">Carregando dados da API...</p>
        </div>
      ) : error ? (
        <div className="text-center text-red-600">
          <p className="text-xl">{error}</p>
          <p className="mt-4">Verifique se as funções Firebase estão configuradas corretamente</p>
          {corsInfo && (
            <div className="mt-4 p-3 bg-gray-100 text-gray-800 rounded text-sm">
              <p><strong>Informações CORS:</strong></p>
              <p>{corsInfo}</p>
            </div>
          )}
          <button 
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => window.location.reload()}
          >
            Tentar Novamente
          </button>
        </div>
      ) : (
        <div className="w-full max-w-3xl">
          {/* Status de saúde */}
          {healthStatus && (
            <div className="bg-green-50 p-6 rounded-lg mb-8 border border-green-200">
              <h2 className="text-xl font-semibold mb-4">Status de Saúde da API</h2>
              <p><strong>Status:</strong> {healthStatus.status}</p>
              <p><strong>Timestamp:</strong> {healthStatus.timestamp}</p>
            </div>
          )}

          {/* Resultado da última operação */}
          {result && (
            <div className="bg-blue-50 p-6 rounded-lg mb-8 border border-blue-200">
              <h2 className="text-xl font-semibold mb-4">Resultado da Operação</h2>
              <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-64">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}

          {/* Lista de agentes */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Agentes Disponíveis</h2>
            
            {agents.length === 0 ? (
              <p>Nenhum agente encontrado.</p>
            ) : (
              <div className="space-y-4">
                {agents.map((agent) => (
                  <div key={agent.id} className="p-4 border rounded-md">
                    <h3 className="font-bold">{agent.name}</h3>
                    <p className="text-gray-600">{agent.description}</p>
                    <p className="text-sm text-gray-500 mt-2">ID: {agent.id}</p>
                    <p className="text-sm text-gray-500">
                      Criado em: {new Date(agent.createdAt).toLocaleString()}
                    </p>
                    {agent.isPublic && (
                      <p className="mt-2"><span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Público</span></p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}