import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';
import { validateAuthentication, AuthData } from './utils/validators';
import { handleError } from './utils/error-handler';

const cors = require('cors')({ origin: true });

// Configurações do LiteralAI
const LITERALAI_API_URL = process.env.LITERALAI_API_URL || 'https://api.literalai.io';
const LITERALAI_API_KEY = process.env.LITERALAI_API_KEY || '';

// Cliente para comunicação com a API do LiteralAI
const literalAiClient = axios.create({
  baseURL: LITERALAI_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${LITERALAI_API_KEY}`
  }
});

/**
 * Classe para gerenciamento de threads de rastreamento
 */
class LiteralAIService {
  /**
   * Criar uma nova thread
   */
  async createThread(name: string, metadata: Record<string, any> = {}) {
    try {
      const response = await literalAiClient.post('/threads', {
        name,
        metadata
      });
      
      return response.data;
    } catch (error) {
      console.error('Erro ao criar thread:', error);
      throw error;
    }
  }

  /**
   * Obter thread por ID
   */
  async getThread(threadId: string) {
    try {
      const response = await literalAiClient.get(`/threads/${threadId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter thread:', error);
      throw error;
    }
  }

  /**
   * Listar threads
   */
  async listThreads(limit?: number, offset?: number) {
    try {
      const params: Record<string, any> = {};
      if (limit) params.limit = limit;
      if (offset) params.offset = offset;
      
      const response = await literalAiClient.get('/threads', { params });
      return response.data;
    } catch (error) {
      console.error('Erro ao listar threads:', error);
      throw error;
    }
  }

  /**
   * Criar um novo step
   */
  async createStep(threadId: string, name: string, type: string, metadata: Record<string, any> = {}) {
    try {
      const response = await literalAiClient.post(`/threads/${threadId}/steps`, {
        name,
        type,
        metadata
      });
      
      return response.data;
    } catch (error) {
      console.error('Erro ao criar step:', error);
      throw error;
    }
  }

  /**
   * Registrar mensagem do usuário
   */
  async trackUserMessage(stepId: string, message: string, metadata: Record<string, any> = {}) {
    try {
      const response = await literalAiClient.post(`/steps/${stepId}/events`, {
        type: 'user_message',
        data: {
          message
        },
        metadata
      });
      
      return response.data;
    } catch (error) {
      console.error('Erro ao registrar mensagem do usuário:', error);
      throw error;
    }
  }

  /**
   * Registrar resposta do assistente
   */
  async trackAssistantMessage(stepId: string, message: string, metadata: Record<string, any> = {}) {
    try {
      // Limitar tamanho da mensagem para evitar erros de string muito grande
      let safeMessage = message;
      const MAX_MESSAGE_LENGTH = 100000; // 100K caracteres

      if (message && message.length > MAX_MESSAGE_LENGTH) {
        console.warn(`Mensagem do assistente muito grande (${message.length} caracteres), truncando para ${MAX_MESSAGE_LENGTH}`);
        safeMessage = message.substring(0, MAX_MESSAGE_LENGTH) + `... [Conteúdo truncado - Tamanho original: ${message.length} caracteres]`;
      }

      const response = await literalAiClient.post(`/steps/${stepId}/events`, {
        type: 'assistant_message',
        data: {
          message: safeMessage
        },
        metadata
      });

      return response.data;
    } catch (error) {
      console.error('Erro ao registrar resposta do assistente:', error);
      throw error;
    }
  }

  /**
   * Registrar geração de LLM
   */
  async trackLLMGeneration(stepId: string, prompt: string, completion: string, model?: string, metadata: Record<string, any> = {}) {
    try {
      const response = await literalAiClient.post(`/steps/${stepId}/events`, {
        type: 'llm_generation',
        data: {
          prompt,
          completion,
          model: model || 'unknown'
        },
        metadata
      });
      
      return response.data;
    } catch (error) {
      console.error('Erro ao registrar geração de LLM:', error);
      throw error;
    }
  }

  /**
   * Registrar recuperação de dados
   */
  async trackRetrieval(stepId: string, query: string, results: any[], metadata: Record<string, any> = {}) {
    try {
      const response = await literalAiClient.post(`/steps/${stepId}/events`, {
        type: 'retrieval',
        data: {
          query,
          results
        },
        metadata
      });
      
      return response.data;
    } catch (error) {
      console.error('Erro ao registrar recuperação:', error);
      throw error;
    }
  }
}

// Criar instância do serviço
const literalAIService = new LiteralAIService();

/**
 * @swagger
 * /createLiteralThread:
 *   post:
 *     summary: Create a new tracking thread
 *     tags: [LiteralAI]
 *     description: Creates a new thread for tracking interactions
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the thread
 *               metadata:
 *                 type: object
 *                 description: Additional metadata for the thread
 *     responses:
 *       200:
 *         description: Thread created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 threadId:
 *                   type: string
 *                   description: The ID of the created thread
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
export const createThread = functions.https.onCall(async (data: any, context: any) => {
  try {
    // Validar autenticação
    if (!context || !context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    // Tipar corretamente os dados de entrada
    const { name, metadata = {} } = data;

    // Validar dados de entrada
    if (!name || typeof name !== 'string') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Nome da thread é obrigatório'
      );
    }

    // Adicionar informações do usuário ao metadata
    const enhancedMetadata = {
      ...metadata,
      userId: context.auth?.uid,
      userEmail: context.auth?.token?.email,
      createdAt: new Date().toISOString()
    };

    // Criar thread
    const thread = await literalAIService.createThread(name, enhancedMetadata);

    return { threadId: thread.id };
  } catch (error) {
    return handleError(error);
  }
});

/**
 * Função para listar threads
 */
export const listThreads = functions.https.onCall(async (data: any, context: any) => {
  try {
    // Validar autenticação
    if (!context || !context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    // Tipar corretamente os dados de entrada
    const { limit, offset } = data;

    // Listar threads
    const threads = await literalAIService.listThreads(limit, offset);

    return { threads };
  } catch (error) {
    return handleError(error);
  }
});

/**
 * Função para criar um step
 */
export const createStep = functions.https.onCall(async (data: any, context: any) => {
  try {
    // Validar autenticação
    if (!context || !context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    // Tipar corretamente os dados de entrada
    const { threadId, name, type, metadata = {} } = data;

    // Validar dados de entrada
    if (!threadId || typeof threadId !== 'string') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'ID da thread é obrigatório'
      );
    }

    if (!name || typeof name !== 'string') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Nome do step é obrigatório'
      );
    }

    if (!type || typeof type !== 'string') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Tipo do step é obrigatório'
      );
    }

    // Adicionar informações do usuário ao metadata
    const enhancedMetadata = {
      ...metadata,
      userId: context.auth?.uid,
      userEmail: context.auth?.token?.email,
      createdAt: new Date().toISOString()
    };

    // Criar step
    const step = await literalAIService.createStep(threadId, name, type, enhancedMetadata);

    return { stepId: step.id };
  } catch (error) {
    return handleError(error);
  }
});

/**
 * Função para rastrear uma mensagem do usuário
 */
export const trackUserMessage = functions.https.onCall(async (data: any, context: any) => {
  try {
    // Validar autenticação
    if (!context || !context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    // Tipar corretamente os dados de entrada
    const { stepId, message, metadata = {} } = data;

    // Validar dados de entrada
    if (!stepId || typeof stepId !== 'string') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'ID do step é obrigatório'
      );
    }

    if (!message || typeof message !== 'string') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Mensagem é obrigatória'
      );
    }

    // Adicionar informações do usuário ao metadata
    const enhancedMetadata = {
      ...metadata,
      userId: context.auth?.uid,
      userEmail: context.auth?.token?.email,
      timestamp: new Date().toISOString()
    };

    // Registrar mensagem
    await literalAIService.trackUserMessage(stepId, message, enhancedMetadata);

    return { success: true };
  } catch (error) {
    return handleError(error);
  }
});

/**
 * Função para rastrear uma resposta do assistente
 */
export const trackAssistantMessage = functions.https.onCall(async (data: any, context: any) => {
  try {
    // Validar autenticação
    if (!context || !context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    // Tipar corretamente os dados de entrada
    const { stepId, message, metadata = {} } = data;

    // Validar dados de entrada
    if (!stepId || typeof stepId !== 'string') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'ID do step é obrigatório'
      );
    }

    if (!message || typeof message !== 'string') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Mensagem é obrigatória'
      );
    }

    // Adicionar informações do usuário ao metadata
    const enhancedMetadata = {
      ...metadata,
      userId: context.auth?.uid,
      userEmail: context.auth?.token?.email,
      timestamp: new Date().toISOString()
    };

    // Registrar mensagem
    await literalAIService.trackAssistantMessage(stepId, message, enhancedMetadata);

    return { success: true };
  } catch (error) {
    return handleError(error);
  }
});

/**
 * Função HTTP para criar uma thread (para uso em sistemas externos)
 */
export const httpCreateThread = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== 'POST') {
        res.status(405).send('Método não permitido');
        return;
      }

      // Verificar token de autenticação
      const idToken = req.headers.authorization?.split('Bearer ')[1];
      if (!idToken) {
        res.status(401).send('Não autorizado');
        return;
      }

      try {
        await admin.auth().verifyIdToken(idToken);
      } catch (error) {
        res.status(401).send('Token inválido');
        return;
      }

      const { name, metadata = {} } = req.body;
      
      // Validar dados de entrada
      if (!name || typeof name !== 'string') {
        res.status(400).send('Nome da thread é obrigatório');
        return;
      }

      // Criar thread
      const thread = await literalAIService.createThread(name, metadata);
      
      res.status(200).json({ threadId: thread.id });
    } catch (error) {
      console.error('Erro ao processar requisição HTTP:', error);
      res.status(500).send('Erro interno do servidor');
    }
  });
});

/**
 * Função HTTP para criar um step (para uso em sistemas externos)
 */
export const httpCreateStep = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== 'POST') {
        res.status(405).send('Método não permitido');
        return;
      }

      // Verificar token de autenticação
      const idToken = req.headers.authorization?.split('Bearer ')[1];
      if (!idToken) {
        res.status(401).send('Não autorizado');
        return;
      }

      try {
        await admin.auth().verifyIdToken(idToken);
      } catch (error) {
        res.status(401).send('Token inválido');
        return;
      }

      const { threadId, name, type, metadata = {} } = req.body;
      
      // Validar dados de entrada
      if (!threadId || typeof threadId !== 'string') {
        res.status(400).send('ID da thread é obrigatório');
        return;
      }

      if (!name || typeof name !== 'string') {
        res.status(400).send('Nome do step é obrigatório');
        return;
      }

      if (!type || typeof type !== 'string') {
        res.status(400).send('Tipo do step é obrigatório');
        return;
      }

      // Criar step
      const step = await literalAIService.createStep(threadId, name, type, metadata);
      
      res.status(200).json({ stepId: step.id });
    } catch (error) {
      console.error('Erro ao processar requisição HTTP:', error);
      res.status(500).send('Erro interno do servidor');
    }
  });
});