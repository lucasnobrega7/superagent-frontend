/**
 * Cliente para integração com o LiteralAI
 * Baseado na biblioteca literalai-typescript
 * 
 * Este cliente permite rastrear interações com agentes de IA,
 * organizando-as em threads e steps para facilitar o monitoramento
 * e análise de desempenho.
 */
class LiteralAIClient {
  private apiKey: string | null;
  private baseUrl: string;
  private currentThreadId: string | null = null;
  private currentStepId: string | null = null;
  private autoTrackEnabled: boolean = false;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_LITERALAI_API_KEY || null;
    this.baseUrl = process.env.NEXT_PUBLIC_LITERALAI_API_URL || 'https://api.literalai.io';
  }

  /**
   * Configurar chave de API para o cliente
   */
  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Configurar URL base para o cliente
   */
  setBaseUrl(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Habilitar/desabilitar rastreamento automático
   */
  enableAutoTracking(enabled: boolean = true) {
    this.autoTrackEnabled = enabled;
  }

  /**
   * Criar uma nova thread de conversação
   */
  async createThread(options: {
    name: string;
    metadata?: Record<string, any>;
  }) {
    const response = await this.request('/threads', {
      method: 'POST',
      body: JSON.stringify({
        name: options.name,
        metadata: options.metadata || {}
      })
    });

    this.currentThreadId = response.id;
    return response;
  }

  /**
   * Envolver uma função com contexto de thread
   */
  async withThread<T>(
    options: { name: string; metadata?: Record<string, any> } | string,
    fn: () => Promise<T>
  ): Promise<T> {
    const threadOptions = typeof options === 'string' 
      ? { name: options } 
      : options;
    
    const thread = await this.createThread(threadOptions);
    const previousThreadId = this.currentThreadId;
    this.currentThreadId = thread.id;

    try {
      const result = await fn();
      return result;
    } finally {
      this.currentThreadId = previousThreadId;
    }
  }

  /**
   * Criar um novo step dentro da thread atual
   */
  async createStep(options: {
    name: string;
    type: string;
    metadata?: Record<string, any>;
    threadId?: string;
  }) {
    const threadId = options.threadId || this.currentThreadId;
    if (!threadId) {
      throw new Error('Nenhuma thread ativa. Crie uma thread primeiro ou forneça um threadId.');
    }

    const response = await this.request(`/threads/${threadId}/steps`, {
      method: 'POST',
      body: JSON.stringify({
        name: options.name,
        type: options.type,
        metadata: options.metadata || {}
      })
    });

    this.currentStepId = response.id;
    return response;
  }

  /**
   * Envolver uma função com contexto de step
   */
  async withStep<T>(
    options: { name: string; type: string; metadata?: Record<string, any>; threadId?: string } | string,
    fn: () => Promise<T>
  ): Promise<T> {
    const stepOptions = typeof options === 'string' 
      ? { name: options, type: 'default' } 
      : options;
    
    const step = await this.createStep(stepOptions);
    const previousStepId = this.currentStepId;
    this.currentStepId = step.id;

    try {
      const result = await fn();
      return result;
    } finally {
      this.currentStepId = previousStepId;
    }
  }

  /**
   * Registrar um evento de recuperação de dados 
   */
  async trackRetrieval(options: {
    query: string;
    results: any[];
    metadata?: Record<string, any>;
    stepId?: string;
    threadId?: string;
  }) {
    const stepId = options.stepId || this.currentStepId;
    const threadId = options.threadId || this.currentThreadId;

    if (!stepId && !threadId) {
      throw new Error('Nenhum step ou thread ativo. Crie um step primeiro ou forneça IDs.');
    }

    let path = '';
    if (stepId) {
      path = `/steps/${stepId}/events`;
    } else if (threadId) {
      path = `/threads/${threadId}/events`;
    }

    return this.request(path, {
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
  }

  /**
   * Registrar um evento de geração de LLM
   */
  async trackLLMGeneration(options: {
    prompt: string;
    completion: string;
    model?: string;
    metadata?: Record<string, any>;
    stepId?: string;
    threadId?: string;
  }) {
    const stepId = options.stepId || this.currentStepId;
    const threadId = options.threadId || this.currentThreadId;

    if (!stepId && !threadId) {
      throw new Error('Nenhum step ou thread ativo. Crie um step primeiro ou forneça IDs.');
    }

    let path = '';
    if (stepId) {
      path = `/steps/${stepId}/events`;
    } else if (threadId) {
      path = `/threads/${threadId}/events`;
    }

    return this.request(path, {
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
  }

  /**
   * Registrar uma interação de chat do usuário
   */
  async trackUserMessage(options: {
    message: string;
    metadata?: Record<string, any>;
    stepId?: string;
    threadId?: string;
  }) {
    const stepId = options.stepId || this.currentStepId;
    const threadId = options.threadId || this.currentThreadId;

    if (!stepId && !threadId) {
      throw new Error('Nenhum step ou thread ativo. Crie um step primeiro ou forneça IDs.');
    }

    let path = '';
    if (stepId) {
      path = `/steps/${stepId}/events`;
    } else if (threadId) {
      path = `/threads/${threadId}/events`;
    }

    return this.request(path, {
      method: 'POST',
      body: JSON.stringify({
        type: 'user_message',
        data: {
          message: options.message
        },
        metadata: options.metadata || {}
      })
    });
  }

  /**
   * Registrar uma resposta do assistente
   */
  async trackAssistantMessage(options: {
    message: string;
    metadata?: Record<string, any>;
    stepId?: string;
    threadId?: string;
  }) {
    const stepId = options.stepId || this.currentStepId;
    const threadId = options.threadId || this.currentThreadId;

    if (!stepId && !threadId) {
      throw new Error('Nenhum step ou thread ativo. Crie um step primeiro ou forneça IDs.');
    }

    let path = '';
    if (stepId) {
      path = `/steps/${stepId}/events`;
    } else if (threadId) {
      path = `/threads/${threadId}/events`;
    }

    return this.request(path, {
      method: 'POST',
      body: JSON.stringify({
        type: 'assistant_message',
        data: {
          message: options.message
        },
        metadata: options.metadata || {}
      })
    });
  }

  /**
   * Listar threads do projeto
   */
  async listThreads(options?: {
    limit?: number;
    offset?: number;
  }) {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());

    const queryString = params.toString();
    const url = queryString ? `/threads?${queryString}` : '/threads';

    return this.request(url);
  }

  /**
   * Obter detalhes de uma thread
   */
  async getThread(threadId: string) {
    return this.request(`/threads/${threadId}`);
  }

  /**
   * Listar steps de uma thread
   */
  async listThreadSteps(threadId: string, options?: {
    limit?: number;
    offset?: number;
  }) {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());

    const queryString = params.toString();
    const url = queryString 
      ? `/threads/${threadId}/steps?${queryString}` 
      : `/threads/${threadId}/steps`;

    return this.request(url);
  }

  /**
   * Método base para fazer requisições 
   */
  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Configurar cabeçalhos padrão
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

      // Verificar se houve erro
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new LiteralAIError(
          response.statusText,
          response.status,
          errorData
        );
      }

      // Verificar se há conteúdo para retornar
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return await response.json();
      } else if (contentType?.includes('text/')) {
        return await response.text();
      } else {
        return {};
      }
    } catch (error) {
      if (error instanceof LiteralAIError) {
        throw error;
      }
      
      throw new LiteralAIError(
        (error as Error).message || 'Erro desconhecido',
        500,
        {}
      );
    }
  }
}

/**
 * Classe de erro para o cliente LiteralAI
 */
export class LiteralAIError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data: any) {
    super(message);
    this.name = 'LiteralAIError';
    this.status = status;
    this.data = data;
  }
}

// Exportar instância para uso em toda a aplicação
export const literalAIClient = new LiteralAIClient();