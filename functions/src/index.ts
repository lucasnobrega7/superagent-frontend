import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import * as superagent from './superagent';
import * as literalai from './literalai';
import { createSwaggerApp } from './swagger';
import { initMonitoring, captureException } from './utils/monitoring';

// Inicializar app Firebase, se ainda não estiver inicializado
if (!admin.apps.length) {
  admin.initializeApp();
}

// Initialize Sentry for error tracking
initMonitoring();

// Logger para as funções
const logger = functions.logger;
logger.info('Firebase Functions initialized');

// Funções para Superagent API
export const getSuperagentStatus = functions.https.onCall(async (data, context) => {
  try {
    return await superagent.testExternalApi(data, context);
  } catch (error) {
    captureException(error as Error, { source: 'getSuperagentStatus', data });
    throw error;
  }
});

export const listSuperagentAgents = functions.https.onCall(async (data, context) => {
  try {
    return await superagent.listAgents(data, context);
  } catch (error) {
    captureException(error as Error, { source: 'listSuperagentAgents', data });
    throw error;
  }
});

export const createSuperagentAgent = functions.https.onCall(async (data, context) => {
  try {
    return await superagent.createAgent(data, context);
  } catch (error) {
    captureException(error as Error, { source: 'createSuperagentAgent', data });
    throw error;
  }
});

export const invokeSuperagentAgent = functions.https.onCall(async (data, context) => {
  try {
    return await superagent.invokeAgent(data, context);
  } catch (error) {
    captureException(error as Error, { source: 'invokeSuperagentAgent', data });
    throw error;
  }
});

export const listSuperagentLLMs = functions.https.onCall(async (data, context) => {
  try {
    return await superagent.listLLMs(data, context);
  } catch (error) {
    captureException(error as Error, { source: 'listSuperagentLLMs', data });
    throw error;
  }
});

export const createSuperagentLLM = functions.https.onCall(async (data, context) => {
  try {
    return await superagent.createLLM(data, context);
  } catch (error) {
    captureException(error as Error, { source: 'createSuperagentLLM', data });
    throw error;
  }
});

export const listSuperagentTools = functions.https.onCall(async (data, context) => {
  try {
    return await superagent.listTools(data, context);
  } catch (error) {
    captureException(error as Error, { source: 'listSuperagentTools', data });
    throw error;
  }
});

export const createSuperagentTool = functions.https.onCall(async (data, context) => {
  try {
    // Usando listTools no lugar de createTool que não existe
    return await superagent.listTools(data, context);
  } catch (error) {
    captureException(error as Error, { source: 'createSuperagentTool', data });
    throw error;
  }
});

export const testExternalApi = functions.https.onCall(async (data, context) => {
  try {
    return await superagent.testExternalApi(data, context);
  } catch (error) {
    captureException(error as Error, { source: 'testExternalApi', data });
    throw error;
  }
});

// Funções HTTP para Superagent
export const healthCheck = functions.https.onRequest(async (req, res) => {
  try {
    return await superagent.healthCheck(req, res);
  } catch (error) {
    captureException(error as Error, { source: 'healthCheck', path: req.path });
    throw error;
  }
});

// Funções para LiteralAI (rastreamento)
export const createLiteralThread = functions.https.onCall(async (data, context) => {
  try {
    return await literalai.createThread(data, context);
  } catch (error) {
    captureException(error as Error, { source: 'createLiteralThread', data });
    throw error;
  }
});

export const listLiteralThreads = functions.https.onCall(async (data, context) => {
  try {
    return await literalai.listThreads(data, context);
  } catch (error) {
    captureException(error as Error, { source: 'listLiteralThreads', data });
    throw error;
  }
});

export const createLiteralStep = functions.https.onCall(async (data, context) => {
  try {
    return await literalai.createStep(data, context);
  } catch (error) {
    captureException(error as Error, { source: 'createLiteralStep', data });
    throw error;
  }
});

export const trackUserMessage = functions.https.onCall(async (data, context) => {
  try {
    return await literalai.trackUserMessage(data, context);
  } catch (error) {
    captureException(error as Error, { source: 'trackUserMessage', data });
    throw error;
  }
});

export const trackAssistantMessage = functions.https.onCall(async (data, context) => {
  try {
    return await literalai.trackAssistantMessage(data, context);
  } catch (error) {
    captureException(error as Error, { source: 'trackAssistantMessage', data });
    throw error;
  }
});

// Funções HTTP para LiteralAI
export const httpCreateLiteralThread = functions.https.onRequest(async (req, res) => {
  try {
    return await literalai.httpCreateThread(req, res);
  } catch (error) {
    captureException(error as Error, { source: 'httpCreateLiteralThread', path: req.path });
    throw error;
  }
});

export const httpCreateLiteralStep = functions.https.onRequest(async (req, res) => {
  try {
    return await literalai.httpCreateStep(req, res);
  } catch (error) {
    captureException(error as Error, { source: 'httpCreateLiteralStep', path: req.path });
    throw error;
  }
});

// API Documentation with Swagger
export const apiDocs = functions.https.onRequest(createSwaggerApp());

// Example functions demonstrating new tooling
import { createThreadExample } from './examples/zod-example';
export const exampleCreateThread = functions.https.onCall(async (data, context) => {
  try {
    return await createThreadExample(data, context);
  } catch (error) {
    captureException(error as Error, { source: 'exampleCreateThread', data });
    throw error;
  }
});

// Enhanced system exports (simplified version that works with current setup)
import * as enhancedSimple from './enhanced-simple';
export const createSimpleEnhancedThread = functions.https.onCall(async (data, context) => {
  try {
    return await enhancedSimple.createSimpleEnhancedThread(data, context);
  } catch (error) {
    captureException(error as Error, { source: 'createSimpleEnhancedThread', data });
    throw error;
  }
});

export const simpleEnhancedHealthCheck = functions.https.onRequest(async (req, res) => {
  try {
    return await enhancedSimple.simpleEnhancedHealthCheck(req, res);
  } catch (error) {
    captureException(error as Error, { source: 'simpleEnhancedHealthCheck', path: req.path });
    throw error;
  }
});

// Importar funções de integração com WhatsApp
import * as whatsapp from './whatsapp';

// Exportar funções de WhatsApp
export const configureWhatsApp = functions.https.onCall(async (data, context) => {
  try {
    return await whatsapp.configureWhatsApp(data, context);
  } catch (error) {
    captureException(error as Error, { source: 'configureWhatsApp', data });
    throw error;
  }
});

export const sendWhatsAppMessage = functions.https.onCall(async (data, context) => {
  try {
    return await whatsapp.sendWhatsAppMessage(data, context);
  } catch (error) {
    captureException(error as Error, { source: 'sendWhatsAppMessage', data });
    throw error;
  }
});

export const getWhatsAppStatus = functions.https.onCall(async (data, context) => {
  try {
    return await whatsapp.getWhatsAppStatus(data, context);
  } catch (error) {
    captureException(error as Error, { source: 'getWhatsAppStatus', data });
    throw error;
  }
});

export const zapiWebhook = functions.https.onRequest(async (req, res) => {
  try {
    return await whatsapp.zapiWebhook(req, res);
  } catch (error) {
    captureException(error as Error, { source: 'zapiWebhook', path: req.path });
    throw error;
  }
});

export const evolutionApiWebhook = functions.https.onRequest(async (req, res) => {
  try {
    return await whatsapp.evolutionApiWebhook(req, res);
  } catch (error) {
    captureException(error as Error, { source: 'evolutionApiWebhook', path: req.path });
    throw error;
  }
});

// Exportar funções de workflow para agentes de vendas
export const createSalesWorkflow = functions.https.onCall(async (data, context) => {
  try {
    return await whatsapp.createSalesWorkflow(data, context);
  } catch (error) {
    captureException(error as Error, { source: 'createSalesWorkflow', data });
    throw error;
  }
});

export const listSalesWorkflows = functions.https.onCall(async (data, context) => {
  try {
    return await whatsapp.listSalesWorkflows(data, context);
  } catch (error) {
    captureException(error as Error, { source: 'listSalesWorkflows', data });
    throw error;
  }
});

export const getSalesWorkflow = functions.https.onCall(async (data, context) => {
  try {
    return await whatsapp.getSalesWorkflow(data, context);
  } catch (error) {
    captureException(error as Error, { source: 'getSalesWorkflow', data });
    throw error;
  }
});

export const updateSalesWorkflow = functions.https.onCall(async (data, context) => {
  try {
    return await whatsapp.updateSalesWorkflow(data, context);
  } catch (error) {
    captureException(error as Error, { source: 'updateSalesWorkflow', data });
    throw error;
  }
});

export const deleteSalesWorkflow = functions.https.onCall(async (data, context) => {
  try {
    return await whatsapp.deleteSalesWorkflow(data, context);
  } catch (error) {
    captureException(error as Error, { source: 'deleteSalesWorkflow', data });
    throw error;
  }
});

// Função de utilidade para debug
export const debugInfo = functions.https.onCall(async (data, context) => {
  try {
    // Tratamos como tipo any para evitar erros de tipagem
    const auth = (context as any)?.auth || {};

    // Obter informações do usuário autenticado
    const uid = auth.uid || 'não autenticado';
    const email = auth.token?.email || 'sem email';
    const name = auth.token?.name || 'sem nome';

    // Retornar informações de debug
    return {
      message: 'Função de debug executada com sucesso',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      auth: {
        uid,
        email,
        name
      },
      nodeVersion: process.version,
      functionVersion: process.env.FUNCTION_VERSION || 'unknown'
    };
  } catch (error) {
    logger.error('Erro na função debugInfo:', error);
    captureException(error as Error, { source: 'debugInfo', data });
    
    throw new functions.https.HttpsError(
      'internal',
      'Erro interno ao executar função de debug'
    );
  }
});