'use client'

import { useState } from 'react'
import ApiFunctionsClient from '@/app/lib/api-functions-client'

export default function FirebaseTestPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-6">Teste de Firebase Functions</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Painel de testes */}
        <div className="space-y-4 border rounded-lg p-6 bg-white shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Funções Disponíveis</h2>
          
          <button 
            onClick={testHelloWorld}
            className="px-4 py-2 bg-green-600 text-white rounded w-full mb-2"
            disabled={loading}
          >
            Testar Hello World
          </button>
          
          <button 
            onClick={testListAgents}
            className="px-4 py-2 bg-blue-600 text-white rounded w-full mb-2"
            disabled={loading}
          >
            Testar Listagem de Agentes
          </button>
          
          <button 
            onClick={testAnalyticsData}
            className="px-4 py-2 bg-purple-600 text-white rounded w-full mb-2"
            disabled={loading}
          >
            Testar Dados Analíticos
          </button>
          
          <button 
            onClick={testExternalApi}
            className="px-4 py-2 bg-yellow-600 text-white rounded w-full"
            disabled={loading}
          >
            Testar API Externa
          </button>
          
          <div className="mt-4 border-t pt-4">
            <h3 className="font-medium mb-2">Criar Agente</h3>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Nome do agente"
                className="w-full p-2 border rounded"
                value={agentData.name}
                onChange={(e) => setAgentData({...agentData, name: e.target.value})}
              />
              <textarea
                placeholder="Descrição do agente"
                className="w-full p-2 border rounded"
                value={agentData.description}
                onChange={(e) => setAgentData({...agentData, description: e.target.value})}
              />
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={agentData.isPublic}
                  onChange={(e) => setAgentData({...agentData, isPublic: e.target.checked})}
                />
                <span>Público</span>
              </label>
              <button 
                onClick={testCreateAgent}
                className="px-4 py-2 bg-green-600 text-white rounded w-full"
                disabled={loading}
              >
                Criar Agente
              </button>
            </div>
          </div>
        </div>
        
        {/* Resultados */}
        <div className="border rounded-lg p-6 bg-white shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Resultados</h2>
          
          {loading && (
            <div className="flex items-center justify-center p-6">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
          )}
          
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded mb-4 text-red-600">
              <strong>Erro:</strong> {error}
            </div>
          )}
          
          {result && !loading && (
            <div className="mt-4 p-4 bg-gray-50 rounded overflow-auto max-h-96">
              <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}
          
          {!result && !loading && !error && (
            <div className="p-4 bg-gray-50 rounded text-center text-gray-500">
              Selecione uma função para testar.
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-8 text-sm text-gray-500">
        <p>Estas funções estão sendo executadas diretamente no Firebase Functions.</p>
        <p>URL base: <code>{process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL || 'Não definido'}</code></p>
      </div>
    </main>
  );
}