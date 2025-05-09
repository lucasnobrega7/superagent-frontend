import { LiteralClient } from '@literalai/client';
import OpenAI from 'openai';

/**
 * Cliente LiteralAI para rastreamento e monitoramento de interações de IA
 */
class LiteralAIService {
  private client: LiteralClient;
  private openai: OpenAI | null = null;
  private isInitialized = false;

  constructor() {
    const apiKey = process.env.NEXT_PUBLIC_LITERALAI_API_KEY;
    
    if (!apiKey) {
      console.warn('LiteralAI API key não encontrada. O rastreamento não estará disponível.');
      // @ts-ignore - Inicialização parcial para evitar erros
      this.client = {};
      return;
    }

    this.client = new LiteralClient({
      apiKey,
      projectId: process.env.NEXT_PUBLIC_LITERALAI_PROJECT_ID,
    });
    
    this.isInitialized = true;
  }

  /**
   * Inicializa o cliente OpenAI com rastreamento automático
   */
  initOpenAI(apiKey?: string) {
    if (!this.isInitialized) return null;

    // Usar a key passada ou a do ambiente
    const key = apiKey || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    if (!key) {
      console.warn('OpenAI API key não encontrada. Rastreamento OpenAI não disponível.');
      return null;
    }

    this.openai = new OpenAI({
      apiKey: key,
    });

    // Configurar instrumentação para rastrear automaticamente chamadas OpenAI
    this.client.instrumentation.openai();
    
    return this.openai;
  }

  /**
   * Inicia uma thread para rastrear uma conversa
   */
  async startThread(name: string, metadata: Record<string, any> = {}) {
    if (!this.isInitialized) return null;
    
    try {
      const thread = await this.client.thread.create({
        name,
        metadata
      });
      
      return thread;
    } catch (error) {
      console.error('Erro ao criar thread LiteralAI:', error);
      return null;
    }
  }

  /**
   * Obtém uma thread existente
   */
  async getThread(threadId: string) {
    if (!this.isInitialized) return null;
    
    try {
      return await this.client.thread.get(threadId);
    } catch (error) {
      console.error('Erro ao obter thread LiteralAI:', error);
      return null;
    }
  }

  /**
   * Adiciona um step a uma thread
   */
  async addStep(threadId: string, name: string, type: string, metadata: Record<string, any> = {}) {
    if (!this.isInitialized) return null;
    
    try {
      const step = await this.client.step.create(threadId, {
        name,
        type,
        metadata
      });
      
      return step;
    } catch (error) {
      console.error('Erro ao criar step LiteralAI:', error);
      return null;
    }
  }

  /**
   * Registra uma mensagem do usuário
   */
  async trackUserMessage(params: { 
    threadId: string, 
    content: string, 
    metadata?: Record<string, any>
  }) {
    if (!this.isInitialized) return null;
    
    try {
      const { threadId, content, metadata = {} } = params;
      
      const stepName = 'Mensagem do Usuário';
      const step = await this.addStep(threadId, stepName, 'input', metadata);
      
      if (!step) return null;
      
      await this.client.event.input(step.id, {
        content,
        metadata
      });
      
      return step;
    } catch (error) {
      console.error('Erro ao rastrear mensagem do usuário:', error);
      return null;
    }
  }

  /**
   * Registra uma resposta do assistente
   */
  async trackAssistantMessage(params: { 
    threadId: string, 
    content: string, 
    metadata?: Record<string, any>
  }) {
    if (!this.isInitialized) return null;
    
    try {
      const { threadId, content, metadata = {} } = params;
      
      const stepName = 'Resposta do Assistente';
      const step = await this.addStep(threadId, stepName, 'output', metadata);
      
      if (!step) return null;
      
      await this.client.event.output(step.id, {
        content,
        metadata
      });
      
      return step;
    } catch (error) {
      console.error('Erro ao rastrear resposta do assistente:', error);
      return null;
    }
  }

  /**
   * Executa função com rastreamento automático em uma thread
   */
  async withThread<T>(params: {
    name: string,
    metadata?: Record<string, any>,
    fn: (threadId: string) => Promise<T>
  }): Promise<T | null> {
    if (!this.isInitialized) {
      return params.fn('not-tracked');
    }
    
    try {
      const { name, metadata = {}, fn } = params;
      
      const thread = await this.startThread(name, metadata);
      if (!thread) {
        return fn('not-tracked');
      }
      
      return await fn(thread.id);
    } catch (error) {
      console.error('Erro em withThread:', error);
      return null;
    }
  }

  /**
   * Retorna o cliente LiteralAI bruto para uso avançado
   */
  getClient() {
    if (!this.isInitialized) return null;
    return this.client;
  }

  /**
   * Retorna o cliente OpenAI configurado com rastreamento
   */
  getOpenAI() {
    return this.openai;
  }
}

// Instância singleton
export const literalai = new LiteralAIService();

// Exportar para uso global
export default literalai;