/**
 * Implementação simplificada do cliente LiteralAI usando fetch
 * Esta implementação evita problemas de compatibilidade com Next.js
 * que ocorrem com a biblioteca oficial @literalai/client
 */

// Tipos para interfaces
interface ThreadOptions {
  name: string;
  metadata?: Record<string, any>;
}

interface StepOptions {
  name: string;
  type: string;
  metadata?: Record<string, any>;
}

interface UserMessageOptions {
  threadId: string;
  content: string;
  metadata?: Record<string, any>;
}

interface AssistantMessageOptions {
  threadId: string;
  content: string;
  metadata?: Record<string, any>;
}

interface LLMGenerationOptions {
  threadId: string;
  prompt: string;
  completion: string;
  model?: string;
  metadata?: Record<string, any>;
}

interface RetrievalOptions {
  threadId: string;
  query: string;
  results: any[];
  metadata?: Record<string, any>;
}

/**
 * Cliente LiteralAI compatível com Next.js
 */
export class LiteralAIClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(options: { apiKey?: string; baseUrl?: string } = {}) {
    this.apiKey = options.apiKey || process.env.NEXT_PUBLIC_LITERALAI_API_KEY || '';
    this.baseUrl = options.baseUrl || process.env.NEXT_PUBLIC_LITERALAI_API_URL || 'https://api.literalai.io';
  }

  /**
   * Criar uma nova thread
   */
  async createThread(options: ThreadOptions) {
    try {
      const response = await this.request('/threads', {
        method: 'POST',
        body: JSON.stringify({
          name: options.name,
          metadata: options.metadata || {}
        })
      });
      
      return response;
    } catch (error) {
      console.error('Error creating thread:', error);
      return null;
    }
  }

  /**
   * Listar threads
   */
  async listThreads(options?: { limit?: number; offset?: number }) {
    try {
      const params = new URLSearchParams();
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.offset) params.append('offset', options.offset.toString());
      
      const queryString = params.toString();
      const url = queryString ? `/threads?${queryString}` : '/threads';
      
      return await this.request(url);
    } catch (error) {
      console.error('Error listing threads:', error);
      return { threads: [] };
    }
  }

  /**
   * Obter uma thread
   */
  async getThread(threadId: string) {
    try {
      return await this.request(`/threads/${threadId}`);
    } catch (error) {
      console.error('Error getting thread:', error);
      return null;
    }
  }

  /**
   * Criar um novo step
   */
  async createStep(threadId: string, options: StepOptions) {
    try {
      const response = await this.request(`/threads/${threadId}/steps`, {
        method: 'POST',
        body: JSON.stringify({
          name: options.name,
          type: options.type,
          metadata: options.metadata || {}
        })
      });
      
      return response;
    } catch (error) {
      console.error('Error creating step:', error);
      return null;
    }
  }

  /**
   * Listar steps de uma thread
   */
  async listSteps(threadId: string, options?: { limit?: number; offset?: number }) {
    try {
      const params = new URLSearchParams();
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.offset) params.append('offset', options.offset.toString());
      
      const queryString = params.toString();
      const url = queryString 
        ? `/threads/${threadId}/steps?${queryString}` 
        : `/threads/${threadId}/steps`;
      
      return await this.request(url);
    } catch (error) {
      console.error('Error listing steps:', error);
      return { steps: [] };
    }
  }

  /**
   * Registrar mensagem do usuário
   */
  async trackUserMessage(options: UserMessageOptions) {
    try {
      // Primeiro criar um step para a mensagem
      const step = await this.createStep(options.threadId, {
        name: 'Mensagem do usuário',
        type: 'input',
        metadata: options.metadata || {}
      });
      
      if (!step) return null;
      
      // Registrar o evento de entrada
      const response = await this.request(`/steps/${step.id}/events`, {
        method: 'POST',
        body: JSON.stringify({
          type: 'user_message',
          data: {
            content: options.content
          },
          metadata: options.metadata || {}
        })
      });
      
      return { step, event: response };
    } catch (error) {
      console.error('Error tracking user message:', error);
      return null;
    }
  }

  /**
   * Registrar resposta do assistente
   */
  async trackAssistantMessage(options: AssistantMessageOptions) {
    try {
      // Primeiro criar um step para a resposta
      const step = await this.createStep(options.threadId, {
        name: 'Resposta do assistente',
        type: 'output',
        metadata: options.metadata || {}
      });
      
      if (!step) return null;
      
      // Registrar o evento de saída
      const response = await this.request(`/steps/${step.id}/events`, {
        method: 'POST',
        body: JSON.stringify({
          type: 'assistant_message',
          data: {
            content: options.content
          },
          metadata: options.metadata || {}
        })
      });
      
      return { step, event: response };
    } catch (error) {
      console.error('Error tracking assistant message:', error);
      return null;
    }
  }

  /**
   * Registrar geração de LLM
   */
  async trackLLMGeneration(options: LLMGenerationOptions) {
    try {
      // Primeiro criar um step para a geração
      const step = await this.createStep(options.threadId, {
        name: 'Geração de LLM',
        type: 'llm_generation',
        metadata: options.metadata || {}
      });
      
      if (!step) return null;
      
      // Registrar o evento de geração
      const response = await this.request(`/steps/${step.id}/events`, {
        method: 'POST',
        body: JSON.stringify({
          type: 'llm_generation',
          data: {
            prompt: options.prompt,
            completion: options.completion,
            model: options.model || 'unknown'
          },
          metadata: options.metadata || {}
        })
      });
      
      return { step, event: response };
    } catch (error) {
      console.error('Error tracking LLM generation:', error);
      return null;
    }
  }

  /**
   * Registrar recuperação (RAG)
   */
  async trackRetrieval(options: RetrievalOptions) {
    try {
      // Primeiro criar um step para a recuperação
      const step = await this.createStep(options.threadId, {
        name: 'Recuperação de conhecimento',
        type: 'retrieval',
        metadata: options.metadata || {}
      });
      
      if (!step) return null;
      
      // Registrar o evento de recuperação
      const response = await this.request(`/steps/${step.id}/events`, {
        method: 'POST',
        body: JSON.stringify({
          type: 'retrieval',
          data: {
            query: options.query,
            results: options.results
          },
          metadata: options.metadata || {}
        })
      });
      
      return { step, event: response };
    } catch (error) {
      console.error('Error tracking retrieval:', error);
      return null;
    }
  }

  /**
   * Método de requisição base
   */
  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Configurar headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {}),
      ...(options.headers || {})
    };
    
    // Fazer a requisição
    try {
      const response = await fetch(url, {
        ...options,
        headers
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return await response.json();
      } else if (contentType?.includes('text/')) {
        return await response.text();
      } else {
        return {};
      }
    } catch (error) {
      console.error(`Request error to ${endpoint}:`, error);
      throw error;
    }
  }
}

// Instância singleton
export const literalAIClient = new LiteralAIClient();

// Cliente para uso do lado do cliente (CSR)
export function getClientSideLiteralAI() {
  return new LiteralAIClient({
    apiKey: process.env.NEXT_PUBLIC_LITERALAI_API_KEY,
    baseUrl: process.env.NEXT_PUBLIC_LITERALAI_API_URL || 'https://api.literalai.io'
  });
}

// Exportar cliente padrão
export default literalAIClient;