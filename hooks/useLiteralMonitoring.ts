import { useState, useCallback, useEffect } from 'react';
import literalai from '@/lib/literalai';

interface UseLiteralMonitoringOptions {
  threadName?: string;
  metadata?: Record<string, any>;
  enabled?: boolean;
  autoStartThread?: boolean;
}

/**
 * Hook para facilitar o uso do LiteralAI em componentes React
 * Baseado na biblioteca oficial @literalai/client
 */
export function useLiteralMonitoring(options: UseLiteralMonitoringOptions = {}) {
  const {
    threadName = 'Thread Automática',
    metadata = {},
    enabled = true,
    autoStartThread = false
  } = options;

  const [isActive, setIsActive] = useState(enabled);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Iniciar thread automaticamente se configurado
  useEffect(() => {
    if (autoStartThread && isActive && !threadId) {
      startThread();
    }
  }, [autoStartThread, isActive, threadId]);

  // Iniciar uma nova thread
  const startThread = useCallback(async (name?: string, customMetadata?: Record<string, any>) => {
    if (!isActive) return null;
    
    try {
      const thread = await literalai.startThread(
        name || threadName,
        {
          ...metadata,
          ...customMetadata,
          startedAt: new Date().toISOString()
        }
      );
      
      if (thread) {
        setThreadId(thread.id);
        setError(null);
        return thread.id;
      }
      return null;
    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error('Erro ao iniciar thread LiteralAI:', error);
      return null;
    }
  }, [isActive, threadName, metadata]);

  // Rastrear mensagem do usuário
  const trackUserMessage = useCallback(async (
    content: string,
    customMetadata?: Record<string, any>
  ) => {
    if (!isActive || !threadId) return null;
    
    try {
      const result = await literalai.trackUserMessage({
        threadId,
        content,
        metadata: {
          ...customMetadata,
          timestamp: new Date().toISOString()
        }
      });
      
      setError(null);
      return result;
    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error('Erro ao rastrear mensagem do usuário:', error);
      return null;
    }
  }, [isActive, threadId]);

  // Rastrear resposta do assistente
  const trackAssistantMessage = useCallback(async (
    content: string,
    customMetadata?: Record<string, any>
  ) => {
    if (!isActive || !threadId) return null;
    
    try {
      const result = await literalai.trackAssistantMessage({
        threadId,
        content,
        metadata: {
          ...customMetadata,
          timestamp: new Date().toISOString()
        }
      });
      
      setError(null);
      return result;
    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error('Erro ao rastrear resposta do assistente:', error);
      return null;
    }
  }, [isActive, threadId]);

  // Executar com rastreamento em thread
  const withThread = useCallback(async <T>(
    nameOrFn: string | ((threadId: string) => Promise<T>),
    metadataOrFn?: Record<string, any> | ((threadId: string) => Promise<T>),
    possibleFn?: ((threadId: string) => Promise<T>)
  ): Promise<T | null> => {
    // Determinar os parâmetros corretos com base na sobrecarga
    let name: string = threadName;
    let customMetadata: Record<string, any> = {};
    let fn: ((threadId: string) => Promise<T>) | undefined;
    
    if (typeof nameOrFn === 'string') {
      name = nameOrFn;
      
      if (typeof metadataOrFn === 'function') {
        fn = metadataOrFn;
      } else if (metadataOrFn) {
        customMetadata = metadataOrFn;
        
        if (possibleFn) {
          fn = possibleFn;
        }
      }
    } else if (typeof nameOrFn === 'function') {
      fn = nameOrFn;
    }
    
    if (!fn) {
      throw new Error("Função de callback não fornecida para withThread");
    }
    
    if (!isActive) {
      return fn('not-tracked');
    }
    
    // Usar thread existente ou criar nova
    const useThreadId = threadId || await startThread(name, customMetadata);
    
    if (!useThreadId) {
      return fn('not-tracked');
    }
    
    try {
      return await fn(useThreadId);
    } catch (err) {
      const error = err as Error;
      console.error('Erro em withThread:', error);
      return null;
    }
  }, [isActive, threadId, startThread, threadName]);

  // Ativar/desativar rastreamento
  const setTracking = useCallback((state: boolean) => {
    setIsActive(state);
  }, []);

  // Cliente OpenAI com rastreamento
  const getTrackedOpenAI = useCallback((apiKey?: string) => {
    return literalai.initOpenAI(apiKey);
  }, []);

  return {
    isActive,
    threadId,
    error,
    startThread,
    trackUserMessage,
    trackAssistantMessage,
    withThread,
    setTracking,
    getTrackedOpenAI,
    client: literalai.getClient()
  };
}

export default useLiteralMonitoring;