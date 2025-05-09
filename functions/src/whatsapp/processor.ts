/**
 * Processador de mensagens de WhatsApp
 * Integra o motor de workflow com as APIs de WhatsApp (Z-API e Evolution API)
 */
import { logger } from 'firebase-functions';
import * as admin from 'firebase-admin';
import { ZAPIWhatsApp, ZAPIMessage } from './z-api';
import { EvolutionAPIWhatsApp, EvolutionAPIMessage } from './evolution-api';
import { WorkflowEngine, WorkflowContext } from './workflow';

// Interface para armazenar configurações de integração
export interface WhatsAppConfig {
  provider: 'z-api' | 'evolution-api';
  config: any;
  defaultWorkflowId?: string;
}

// Interface para mensagem padronizada
export interface Message {
  id: string;
  phone: string;
  fromMe: boolean;
  text: string;
  timestamp: number;
  type: string;
}

// Interface para metadados de processamento
export interface ProcessMetadata {
  provider: string;
  sourceId: string;
  originalMessage: any;
}

/**
 * Processador de mensagens do WhatsApp
 */
export class WhatsAppProcessor {
  private db: admin.firestore.Firestore;
  private zapi: ZAPIWhatsApp | null = null;
  private evolutionApi: EvolutionAPIWhatsApp | null = null;
  private workflowEngine: WorkflowEngine;

  constructor() {
    this.db = admin.firestore();
    this.workflowEngine = new WorkflowEngine();
  }

  /**
   * Inicializa o processador com configurações
   */
  async initialize(config: WhatsAppConfig): Promise<boolean> {
    try {
      if (config.provider === 'z-api') {
        this.zapi = new ZAPIWhatsApp(config.config);
      } else if (config.provider === 'evolution-api') {
        this.evolutionApi = new EvolutionAPIWhatsApp(config.config);
        // Para Evolution API, criamos a instância
        await this.evolutionApi.createInstance();
      } else {
        throw new Error(`Provedor não suportado: ${config.provider}`);
      }

      // Armazenar configuração atual no Firestore
      await this.db.collection('whatsapp_config').doc('current').set({
        provider: config.provider,
        config: config.config,
        defaultWorkflowId: config.defaultWorkflowId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return true;
    } catch (error) {
      logger.error('Erro ao inicializar processador de WhatsApp:', error);
      return false;
    }
  }

  /**
   * Envia uma mensagem de texto via WhatsApp
   */
  async sendText(phone: string, message: string): Promise<boolean> {
    try {
      // Garantir que existe um cliente inicializado
      if (!this.zapi && !this.evolutionApi) {
        const config = await this.loadCurrentConfig();
        if (!config) {
          throw new Error('Nenhuma configuração de WhatsApp encontrada');
        }
        await this.initialize(config);
      }

      if (this.zapi) {
        await this.zapi.sendText({ phone, message });
      } else if (this.evolutionApi) {
        await this.evolutionApi.sendText({ number: phone, message });
      } else {
        throw new Error('Nenhum provedor de WhatsApp configurado');
      }

      return true;
    } catch (error) {
      logger.error(`Erro ao enviar mensagem para ${phone}:`, error);
      return false;
    }
  }

  /**
   * Carrega a configuração atual do Firestore
   */
  private async loadCurrentConfig(): Promise<WhatsAppConfig | null> {
    try {
      const doc = await this.db.collection('whatsapp_config').doc('current').get();
      if (!doc.exists) {
        return null;
      }
      return doc.data() as WhatsAppConfig;
    } catch (error) {
      logger.error('Erro ao carregar configuração do WhatsApp:', error);
      return null;
    }
  }

  /**
   * Processa uma mensagem recebida via webhook do Z-API
   */
  async processZAPIWebhook(payload: any): Promise<Message | null> {
    if (!this.zapi) {
      const config = await this.loadCurrentConfig();
      if (!config || config.provider !== 'z-api') {
        logger.error('Configuração Z-API não encontrada');
        return null;
      }
      this.zapi = new ZAPIWhatsApp(config.config);
    }

    try {
      const zapiMessage = this.zapi.processWebhook(payload);
      if (!zapiMessage) return null;

      // Converter para formato padrão
      const message: Message = {
        id: zapiMessage.id,
        phone: zapiMessage.phone,
        fromMe: zapiMessage.fromMe,
        text: zapiMessage.text.message,
        timestamp: zapiMessage.timestamp,
        type: zapiMessage.type
      };

      // Processar mensagem pelo workflow
      await this.processMessage(message, {
        provider: 'z-api',
        sourceId: zapiMessage.id,
        originalMessage: zapiMessage
      });

      return message;
    } catch (error) {
      logger.error('Erro ao processar webhook Z-API:', error);
      return null;
    }
  }

  /**
   * Processa uma mensagem recebida via webhook do Evolution API
   */
  async processEvolutionAPIWebhook(payload: any): Promise<Message | null> {
    if (!this.evolutionApi) {
      const config = await this.loadCurrentConfig();
      if (!config || config.provider !== 'evolution-api') {
        logger.error('Configuração Evolution API não encontrada');
        return null;
      }
      this.evolutionApi = new EvolutionAPIWhatsApp(config.config);
    }

    try {
      const evolutionMessage = this.evolutionApi.processWebhook(payload);
      if (!evolutionMessage) return null;

      // Converter para formato padrão
      const message: Message = {
        id: evolutionMessage.id,
        phone: evolutionMessage.from,
        fromMe: evolutionMessage.fromMe,
        text: evolutionMessage.body,
        timestamp: evolutionMessage.timestamp,
        type: evolutionMessage.type
      };

      // Processar mensagem pelo workflow
      await this.processMessage(message, {
        provider: 'evolution-api',
        sourceId: evolutionMessage.id,
        originalMessage: evolutionMessage
      });

      return message;
    } catch (error) {
      logger.error('Erro ao processar webhook Evolution API:', error);
      return null;
    }
  }

  /**
   * Processa uma mensagem recebida e a encaminha para o workflow apropriado
   */
  private async processMessage(message: Message, metadata: ProcessMetadata): Promise<void> {
    try {
      // Ignorar mensagens enviadas pelo próprio bot
      if (message.fromMe) {
        return;
      }

      // Buscar sessão ativa para o número
      const sessionQuery = await this.db.collection('workflow_sessions')
        .where('phone', '==', message.phone)
        .where('isActive', '==', true)
        .orderBy('updatedAt', 'desc')
        .limit(1)
        .get();

      if (!sessionQuery.empty) {
        // Encontrou uma sessão ativa - continuar conversa
        const session = sessionQuery.docs[0].data() as WorkflowContext & { isActive: boolean };
        await this.continueConversation(session.sessionId, message);
        return;
      }

      // Não encontrou sessão ativa - iniciar nova conversa
      await this.startNewConversation(message);
    } catch (error) {
      logger.error(`Erro ao processar mensagem ${message.id}:`, error);
    }
  }

  /**
   * Continua uma conversa em andamento
   */
  private async continueConversation(sessionId: string, message: Message): Promise<void> {
    try {
      // Executar próximo passo do workflow com a mensagem recebida
      const result = await this.workflowEngine.executeStep(sessionId, message.text);

      // Enviar resposta se houver
      if (result.output) {
        await this.sendText(message.phone, result.output);
      }

      // Verificar se o workflow terminou
      if (result.isComplete) {
        logger.info(`Conversa ${sessionId} finalizada`);
      }
    } catch (error) {
      logger.error(`Erro ao continuar conversa ${sessionId}:`, error);
      await this.sendText(message.phone, "Desculpe, tive um problema ao processar sua mensagem. Por favor, tente novamente mais tarde.");
    }
  }

  /**
   * Inicia uma nova conversa
   */
  private async startNewConversation(message: Message): Promise<void> {
    try {
      // Carregar configuração atual
      const config = await this.loadCurrentConfig();
      if (!config || !config.defaultWorkflowId) {
        logger.error('Nenhum workflow padrão configurado');
        await this.sendText(message.phone, "Desculpe, não tenho um fluxo de conversa configurado para atendê-lo no momento.");
        return;
      }

      // Iniciar nova sessão de workflow
      const context = await this.workflowEngine.startSession(
        config.defaultWorkflowId, 
        message.phone,
        {
          input: message.text,
          variables: {
            initialMessage: message.text
          },
          metadata: {
            source: 'whatsapp'
          }
        }
      );

      // Executar primeiro passo
      const result = await this.workflowEngine.executeStep(context.sessionId);

      // Enviar resposta se houver
      if (result.output) {
        await this.sendText(message.phone, result.output);
      }
    } catch (error) {
      logger.error(`Erro ao iniciar nova conversa para ${message.phone}:`, error);
      await this.sendText(
        message.phone,
        "Olá! Infelizmente estou com problemas para iniciar nossa conversa. Por favor, tente novamente mais tarde."
      );
    }
  }

  /**
   * Obtém status do serviço de WhatsApp
   */
  async getStatus(): Promise<{
    provider: string;
    connected: boolean;
    status: string;
  }> {
    try {
      // Garantir que existe um cliente inicializado
      if (!this.zapi && !this.evolutionApi) {
        const config = await this.loadCurrentConfig();
        if (!config) {
          return {
            provider: 'none',
            connected: false,
            status: 'not_configured'
          };
        }
        await this.initialize(config);
      }

      if (this.zapi) {
        const status = await this.zapi.getStatus();
        return {
          provider: 'z-api',
          connected: status.connected,
          status: status.status
        };
      } else if (this.evolutionApi) {
        const status = await this.evolutionApi.getStatus();
        return {
          provider: 'evolution-api',
          connected: status.connected,
          status: status.status
        };
      }

      return {
        provider: 'unknown',
        connected: false,
        status: 'error'
      };
    } catch (error) {
      logger.error('Erro ao obter status do WhatsApp:', error);
      return {
        provider: 'error',
        connected: false,
        status: 'error'
      };
    }
  }
}