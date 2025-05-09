import { useState, useCallback, useEffect } from 'react';
import { literalAIClient } from '../lib/literalai-client';

type StepType = 'user_input' | 'retrieval' | 'llm_generation' | 'assistant_response' | 'tool_use' | 'error';

interface UseLiteralAIOptions {
  autoStartThread?: boolean;
  threadName?: string;
  threadMetadata?: Record<string, any>;
  enableTracking?: boolean;
}

/**
 * Hook para facilitar o uso do LiteralAI em componentes React
 */
export function useLiteralAI(options: UseLiteralAIOptions = {}) {
  const {
    autoStartThread = false,
    threadName = 'Thread Automática',
    threadMetadata = {},
    enableTracking = true
  } = options;

  const [isActive, setIsActive] = useState(enableTracking);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [currentStepId, setCurrentStepId] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Iniciar thread automaticamente se configurado
  useEffect(() => {
    if (autoStartThread && enableTracking && !threadId) {
      startThread(threadName, threadMetadata);
    }
  }, [autoStartThread, enableTracking, threadId, threadName]);

  // Iniciar uma nova thread
  const startThread = useCallback(async (name: string = threadName, metadata: Record<string, any> = {}) => {
    if (!isActive) return null;
    
    try {
      const thread = await literalAIClient.createThread({
        name,
        metadata: {
          ...threadMetadata,
          ...metadata,
          startedAt: new Date().toISOString()
        }
      });
      setThreadId(thread.id);
      setError(null);
      return thread.id;
    } catch (err) {
      setError(err as Error);
      console.error('Erro ao iniciar thread:', err);
      return null;
    }
  }, [isActive, threadName, threadMetadata]);

  // Iniciar um novo step
  const startStep = useCallback(async (
    name: string,
    type: StepType,
    metadata: Record<string, any> = {}
  ) => {
    if (!isActive || !threadId) return null;
    
    try {
      const step = await literalAIClient.createStep({
        name,
        type,
        threadId,
        metadata: {
          ...metadata,
          startedAt: new Date().toISOString()
        }
      });
      setCurrentStepId(step.id);
      setError(null);
      return step.id;
    } catch (err) {
      setError(err as Error);
      console.error('Erro ao iniciar step:', err);
      return null;
    }
  }, [isActive, threadId]);

  // Rastrear mensagem do usuário
  const trackUserMessage = useCallback(async (
    message: string,
    metadata: Record<string, any> = {}
  ) => {
    if (!isActive || !threadId) return;
    
    try {
      // Criar um step para a mensagem do usuário
      const stepId = await startStep('Mensagem do usuário', 'user_input', metadata);
      
      // Registrar o evento
      if (stepId) {
        await literalAIClient.trackUserMessage({
          message,
          stepId,
          metadata: {
            ...metadata,
            timestamp: new Date().toISOString()
          }
        });
      }
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error('Erro ao rastrear mensagem do usuário:', err);
    }
  }, [isActive, threadId, startStep]);

  // Rastrear resposta do assistente
  const trackAssistantMessage = useCallback(async (
    message: string,
    metadata: Record<string, any> = {}
  ) => {
    if (!isActive || !threadId) return;
    
    try {
      // Criar um step para a resposta do assistente
      const stepId = await startStep('Resposta do assistente', 'assistant_response', metadata);
      
      // Registrar o evento
      if (stepId) {
        await literalAIClient.trackAssistantMessage({
          message,
          stepId,
          metadata: {
            ...metadata,
            timestamp: new Date().toISOString()
          }
        });
      }
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error('Erro ao rastrear resposta do assistente:', err);
    }
  }, [isActive, threadId, startStep]);

  // Rastrear geração de LLM
  const trackLLMGeneration = useCallback(async (
    prompt: string,
    completion: string,
    model?: string,
    metadata: Record<string, any> = {}
  ) => {
    if (!isActive || !threadId) return;
    
    try {
      // Criar um step para a geração de LLM
      const stepId = await startStep('Geração de LLM', 'llm_generation', metadata);
      
      // Registrar o evento
      if (stepId) {
        await literalAIClient.trackLLMGeneration({
          prompt,
          completion,
          model,
          stepId,
          metadata: {
            ...metadata,
            timestamp: new Date().toISOString()
          }
        });
      }
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error('Erro ao rastrear geração de LLM:', err);
    }
  }, [isActive, threadId, startStep]);

  // Rastrear recuperação (RAG)
  const trackRetrieval = useCallback(async (
    query: string,
    results: any[],
    metadata: Record<string, any> = {}
  ) => {
    if (!isActive || !threadId) return;
    
    try {
      // Criar um step para a recuperação
      const stepId = await startStep('Recuperação de conhecimento', 'retrieval', metadata);
      
      // Registrar o evento
      if (stepId) {
        await literalAIClient.trackRetrieval({
          query,
          results,
          stepId,
          metadata: {
            ...metadata,
            timestamp: new Date().toISOString(),
            resultCount: results.length
          }
        });
      }
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error('Erro ao rastrear recuperação:', err);
    }
  }, [isActive, threadId, startStep]);

  // Envolver função com contexto de thread
  const withThread = useCallback(async <T>(
    nameOrOptions: string | { name: string; metadata?: Record<string, any> },
    fn: () => Promise<T>
  ): Promise<T> => {
    if (!isActive) return fn();
    
    try {
      const result = await literalAIClient.withThread(nameOrOptions, fn);
      return result;
    } catch (err) {
      console.error('Erro em withThread:', err);
      throw err;
    }
  }, [isActive]);

  // Envolver função com contexto de step
  const withStep = useCallback(async <T>(
    nameOrOptions: string | { name: string; type: StepType; metadata?: Record<string, any> },
    fn: () => Promise<T>
  ): Promise<T> => {
    if (!isActive || !threadId) return fn();
    
    const options = typeof nameOrOptions === 'string'
      ? { name: nameOrOptions, type: 'user_input' as StepType }
      : nameOrOptions;
    
    try {
      const stepOptions = {
        ...options,
        threadId
      };
      
      const result = await literalAIClient.withStep(stepOptions, fn);
      return result;
    } catch (err) {
      console.error('Erro em withStep:', err);
      throw err;
    }
  }, [isActive, threadId]);

  // Ativar/desativar rastreamento
  const setTracking = useCallback((enabled: boolean) => {
    setIsActive(enabled);
  }, []);

  return {
    isActive,
    threadId,
    currentStepId,
    error,
    startThread,
    startStep,
    trackUserMessage,
    trackAssistantMessage,
    trackLLMGeneration,
    trackRetrieval,
    withThread,
    withStep,
    setTracking
  };
}

export default useLiteralAI;