import { useState, useEffect } from 'react';
import { literalAIClient } from '../../lib/literalai-client';

interface ConversationAnalyticsProps {
  threadId: string | null;
  agentId?: string | null;
}

/**
 * Componente para exibir análises de conversas do LiteralAI
 */
export function ConversationAnalytics({
  threadId,
  agentId
}: ConversationAnalyticsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [threadDetails, setThreadDetails] = useState<any | null>(null);
  const [steps, setSteps] = useState<any[]>([]);
  
  // Carregar detalhes da thread quando o ID mudar
  useEffect(() => {
    if (!threadId) return;
    
    const fetchThreadDetails = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Carregar detalhes da thread
        const thread = await literalAIClient.getThread(threadId);
        setThreadDetails(thread);
        
        // Carregar steps da thread
        const stepsData = await literalAIClient.listThreadSteps(threadId);
        setSteps(stepsData.items || []);
      } catch (err) {
        console.error('Erro ao carregar dados de análise:', err);
        setError('Falha ao carregar dados de análise da conversa');
      } finally {
        setLoading(false);
      }
    };
    
    fetchThreadDetails();
  }, [threadId]);
  
  // Calcular métricas básicas
  const metrics = {
    totalSteps: steps.length,
    userMessages: steps.filter(step => step.type === 'user_input').length,
    assistantMessages: steps.filter(step => step.type === 'assistant_response').length,
    retrievalEvents: steps.filter(step => step.type === 'retrieval').length,
    llmGenerations: steps.filter(step => step.type === 'llm_generation').length,
    errorEvents: steps.filter(step => step.type === 'error').length
  };
  
  // Calcular duração total da conversa
  const conversationDuration = threadDetails 
    ? calculateDuration(threadDetails.created_at) 
    : null;
  
  // Calcular tempo médio de resposta
  const averageResponseTime = calculateAverageResponseTime(steps);
  
  if (loading) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <p className="text-gray-500">Carregando análises de conversa...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 bg-white rounded-lg shadow border-l-4 border-red-500">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }
  
  if (!threadDetails) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <p className="text-gray-500">Selecione uma conversa para ver análises.</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b">
        <h3 className="text-lg font-medium">Análise de Conversa</h3>
        <p className="text-sm text-gray-500">
          Thread: {threadDetails.name} 
          {agentId && <span> • Agente: {agentId}</span>}
        </p>
      </div>
      
      <div className="p-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {/* Métricas de conversa */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-xs text-gray-500">Duração</p>
          <p className="text-xl font-semibold">{conversationDuration || 'N/A'}</p>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-xs text-gray-500">Interações</p>
          <p className="text-xl font-semibold">{metrics.totalSteps}</p>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-xs text-gray-500">Tempo médio de resposta</p>
          <p className="text-xl font-semibold">{averageResponseTime || 'N/A'}</p>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-xs text-gray-500">Fontes consultadas</p>
          <p className="text-xl font-semibold">{metrics.retrievalEvents}</p>
        </div>
      </div>
      
      {/* Timeline de eventos */}
      <div className="p-4 border-t">
        <h4 className="text-sm font-medium mb-3">Timeline de Eventos</h4>
        
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {steps.length > 0 ? (
            steps.map((step, index) => (
              <div key={step.id} className="flex items-start">
                <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${getStepTypeColor(step.type)}`}></div>
                <div className="ml-3">
                  <p className="text-sm">{step.name}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(step.created_at).toLocaleTimeString()} • {formatStepType(step.type)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">Nenhum evento registrado.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Funções auxiliares
function calculateDuration(startTimeStr: string): string {
  const startTime = new Date(startTimeStr);
  const endTime = new Date();
  const durationMs = endTime.getTime() - startTime.getTime();
  
  // Converter para formato legível
  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.floor((durationMs % 60000) / 1000);
  
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

function calculateAverageResponseTime(steps: any[]): string | null {
  const responsePairs = [];
  
  // Encontrar pares de mensagens (usuário -> assistente)
  for (let i = 0; i < steps.length - 1; i++) {
    if (steps[i].type === 'user_input' && steps[i+1].type === 'assistant_response') {
      const userTime = new Date(steps[i].created_at).getTime();
      const assistantTime = new Date(steps[i+1].created_at).getTime();
      const responseTime = assistantTime - userTime;
      responsePairs.push(responseTime);
    }
  }
  
  if (responsePairs.length === 0) return null;
  
  // Calcular média
  const averageMs = responsePairs.reduce((sum, time) => sum + time, 0) / responsePairs.length;
  const seconds = Math.floor(averageMs / 1000);
  const ms = Math.floor(averageMs % 1000);
  
  return `${seconds}.${ms}s`;
}

function formatStepType(type: string): string {
  const typeMap: Record<string, string> = {
    'user_input': 'Mensagem do usuário',
    'assistant_response': 'Resposta do assistente',
    'retrieval': 'Recuperação de conhecimento',
    'llm_generation': 'Geração de LLM',
    'tool_use': 'Uso de ferramenta',
    'error': 'Erro'
  };
  
  return typeMap[type] || type;
}

function getStepTypeColor(type: string): string {
  const colorMap: Record<string, string> = {
    'user_input': 'bg-blue-500',
    'assistant_response': 'bg-green-500',
    'retrieval': 'bg-purple-500',
    'llm_generation': 'bg-yellow-500',
    'tool_use': 'bg-indigo-500',
    'error': 'bg-red-500'
  };
  
  return colorMap[type] || 'bg-gray-500';
}

export default ConversationAnalytics;