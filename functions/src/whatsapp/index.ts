/**
 * Integrações de WhatsApp para Agentes de Vendas
 * Exporta funções HTTP e Cloud Functions para integração com WhatsApp via Z-API e Evolution API
 */
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { WhatsAppProcessor, WhatsAppConfig } from './processor';
import { WorkflowEngine, WorkflowSchema } from './workflow';
import { z } from 'zod';
import cors from 'cors';
import { corsHandler } from '../utils/cors-handler';

// Inicializar processor
const processor = new WhatsAppProcessor();
const workflowEngine = new WorkflowEngine();

// Schemas de validação
const ConfigureWhatsAppSchema = z.object({
  provider: z.enum(['z-api', 'evolution-api']),
  config: z.record(z.any()),
  defaultWorkflowId: z.string().optional()
});

const SendMessageSchema = z.object({
  phone: z.string(),
  message: z.string(),
  delayMessage: z.number().optional(),
  delayTyping: z.number().optional()
});

const CreateWorkflowSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  nodes: z.array(z.object({
    id: z.string(),
    type: z.enum(['message', 'condition', 'delay', 'input', 'integration', 'end']),
    content: z.record(z.any()),
    next: z.array(z.object({
      id: z.string(),
      condition: z.string().optional()
    })).optional()
  })),
  startNodeId: z.string(),
  isPublic: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional()
});

/**
 * Configura a integração com WhatsApp
 */
export const configureWhatsApp = functions.https.onCall(async (data, context) => {
  try {
    // Verificar autenticação do administrador
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Autenticação necessária para configurar o WhatsApp'
      );
    }

    // Verificar se o usuário é um administrador
    const userSnapshot = await admin.firestore().collection('users')
      .doc(context.auth.uid).get();
    
    if (!userSnapshot.exists || !userSnapshot.data()?.isAdmin) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Apenas administradores podem configurar o WhatsApp'
      );
    }

    // Validar dados
    const validatedData = ConfigureWhatsAppSchema.parse(data);
    
    // Inicializar o processador com a configuração
    const success = await processor.initialize(validatedData);
    if (!success) {
      throw new functions.https.HttpsError(
        'internal',
        'Erro ao configurar WhatsApp'
      );
    }

    return {
      success: true,
      message: 'WhatsApp configurado com sucesso'
    };
  } catch (error) {
    functions.logger.error('Erro ao configurar WhatsApp:', error);
    
    if (error instanceof z.ZodError) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Dados de configuração inválidos',
        { errors: error.errors }
      );
    }
    
    throw new functions.https.HttpsError(
      'internal',
      'Erro interno ao configurar WhatsApp',
      { error: String(error) }
    );
  }
});

/**
 * Envia uma mensagem via WhatsApp
 */
export const sendWhatsAppMessage = functions.https.onCall(async (data, context) => {
  try {
    // Verificar autenticação
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Autenticação necessária para enviar mensagens'
      );
    }

    // Validar dados
    const validatedData = SendMessageSchema.parse(data);
    
    // Enviar mensagem
    const success = await processor.sendText(
      validatedData.phone, 
      validatedData.message
    );
    
    if (!success) {
      throw new functions.https.HttpsError(
        'internal',
        'Erro ao enviar mensagem'
      );
    }

    return {
      success: true,
      message: 'Mensagem enviada com sucesso'
    };
  } catch (error) {
    functions.logger.error('Erro ao enviar mensagem WhatsApp:', error);
    
    if (error instanceof z.ZodError) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Dados da mensagem inválidos',
        { errors: error.errors }
      );
    }
    
    throw new functions.https.HttpsError(
      'internal',
      'Erro interno ao enviar mensagem',
      { error: String(error) }
    );
  }
});

/**
 * Obter status da integração WhatsApp
 */
export const getWhatsAppStatus = functions.https.onCall(async (data, context) => {
  try {
    const status = await processor.getStatus();
    return status;
  } catch (error) {
    functions.logger.error('Erro ao obter status do WhatsApp:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Erro interno ao verificar status do WhatsApp',
      { error: String(error) }
    );
  }
});

/**
 * Webhook para receber mensagens do Z-API
 */
export const zapiWebhook = functions.https.onRequest(async (req, res) => {
  // Aplicar CORS
  return corsHandler(req, res, async () => {
    try {
      // Verificar método
      if (req.method !== 'POST') {
        res.status(405).send({ success: false, error: 'Método não permitido' });
        return;
      }
      
      // Processar webhook
      const message = await processor.processZAPIWebhook(req.body);
      
      // Retornar sucesso mesmo se a mensagem não for processada
      // (para evitar que o Z-API tente reenviar)
      res.status(200).send({ success: true, processed: !!message });
    } catch (error) {
      functions.logger.error('Erro no webhook Z-API:', error);
      res.status(500).send({ success: false, error: 'Erro interno' });
    }
  });
});

/**
 * Webhook para receber mensagens do Evolution API
 */
export const evolutionApiWebhook = functions.https.onRequest(async (req, res) => {
  // Aplicar CORS
  return corsHandler(req, res, async () => {
    try {
      // Verificar método
      if (req.method !== 'POST') {
        res.status(405).send({ success: false, error: 'Método não permitido' });
        return;
      }
      
      // Processar webhook
      const message = await processor.processEvolutionAPIWebhook(req.body);
      
      // Retornar sucesso mesmo se a mensagem não for processada
      res.status(200).send({ success: true, processed: !!message });
    } catch (error) {
      functions.logger.error('Erro no webhook Evolution API:', error);
      res.status(500).send({ success: false, error: 'Erro interno' });
    }
  });
});

/**
 * Criar novo workflow para agente de vendas
 */
export const createSalesWorkflow = functions.https.onCall(async (data, context) => {
  try {
    // Verificar autenticação
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Autenticação necessária para criar workflows'
      );
    }

    // Validar dados
    const validatedData = CreateWorkflowSchema.parse(data);
    
    // Criar workflow
    const workflow = await workflowEngine.createWorkflow({
      ...validatedData,
      metadata: {
        ...validatedData.metadata,
        createdBy: context.auth.uid
      }
    });

    return {
      success: true,
      workflowId: workflow.id,
      workflow
    };
  } catch (error) {
    functions.logger.error('Erro ao criar workflow:', error);
    
    if (error instanceof z.ZodError) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Dados do workflow inválidos',
        { errors: error.errors }
      );
    }
    
    throw new functions.https.HttpsError(
      'internal',
      'Erro interno ao criar workflow',
      { error: String(error) }
    );
  }
});

/**
 * Listar workflows disponíveis
 */
export const listSalesWorkflows = functions.https.onCall(async (data, context) => {
  try {
    // Autenticação opcional (usuários não autenticados veem apenas workflows públicos)
    const isPublic = !context.auth;
    
    // Opções de filtragem
    const options = {
      isPublic: isPublic ? true : undefined,
      tags: data?.tags,
      limit: data?.limit || 20
    };
    
    // Buscar workflows
    const workflows = await workflowEngine.listWorkflows(options);
    
    return {
      success: true,
      workflows
    };
  } catch (error) {
    functions.logger.error('Erro ao listar workflows:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Erro interno ao listar workflows',
      { error: String(error) }
    );
  }
});

/**
 * Obter detalhes de um workflow
 */
export const getSalesWorkflow = functions.https.onCall(async (data, context) => {
  try {
    // Validar ID do workflow
    if (!data?.id || typeof data.id !== 'string') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'ID do workflow é necessário'
      );
    }
    
    // Buscar workflow
    const workflow = await workflowEngine.getWorkflow(data.id);
    
    if (!workflow) {
      throw new functions.https.HttpsError(
        'not-found',
        'Workflow não encontrado'
      );
    }
    
    // Verificar permissão para workflows privados
    if (!workflow.isPublic && !context.auth) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Acesso negado ao workflow privado'
      );
    }
    
    return {
      success: true,
      workflow
    };
  } catch (error) {
    functions.logger.error('Erro ao obter workflow:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Erro interno ao obter workflow',
      { error: String(error) }
    );
  }
});

/**
 * Atualizar um workflow existente
 */
export const updateSalesWorkflow = functions.https.onCall(async (data, context) => {
  try {
    // Verificar autenticação
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Autenticação necessária para atualizar workflows'
      );
    }

    // Validar ID do workflow
    if (!data?.id || typeof data.id !== 'string') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'ID do workflow é necessário'
      );
    }
    
    // Remover campos que não podem ser atualizados
    const { id, createdAt, updatedAt, version, ...updateData } = data;
    
    // Validar dados
    const validatedData = WorkflowSchema.partial().parse(updateData);
    
    // Buscar workflow para verificar permissão
    const existingWorkflow = await workflowEngine.getWorkflow(id);
    if (!existingWorkflow) {
      throw new functions.https.HttpsError(
        'not-found',
        'Workflow não encontrado'
      );
    }
    
    // Verificar se o usuário é o criador ou admin
    const isCreator = existingWorkflow.metadata?.createdBy === context.auth.uid;
    const userSnapshot = await admin.firestore().collection('users')
      .doc(context.auth.uid).get();
    const isAdmin = userSnapshot.exists && userSnapshot.data()?.isAdmin;
    
    if (!isCreator && !isAdmin) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Apenas o criador ou administradores podem atualizar este workflow'
      );
    }
    
    // Atualizar workflow
    const updatedWorkflow = await workflowEngine.updateWorkflow(id, validatedData);
    
    return {
      success: true,
      workflow: updatedWorkflow
    };
  } catch (error) {
    functions.logger.error('Erro ao atualizar workflow:', error);
    
    if (error instanceof z.ZodError) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Dados do workflow inválidos',
        { errors: error.errors }
      );
    }
    
    throw new functions.https.HttpsError(
      'internal',
      'Erro interno ao atualizar workflow',
      { error: String(error) }
    );
  }
});

/**
 * Excluir um workflow
 */
export const deleteSalesWorkflow = functions.https.onCall(async (data, context) => {
  try {
    // Verificar autenticação
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Autenticação necessária para excluir workflows'
      );
    }

    // Validar ID do workflow
    if (!data?.id || typeof data.id !== 'string') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'ID do workflow é necessário'
      );
    }
    
    // Buscar workflow para verificar permissão
    const existingWorkflow = await workflowEngine.getWorkflow(data.id);
    if (!existingWorkflow) {
      throw new functions.https.HttpsError(
        'not-found',
        'Workflow não encontrado'
      );
    }
    
    // Verificar se o usuário é o criador ou admin
    const isCreator = existingWorkflow.metadata?.createdBy === context.auth.uid;
    const userSnapshot = await admin.firestore().collection('users')
      .doc(context.auth.uid).get();
    const isAdmin = userSnapshot.exists && userSnapshot.data()?.isAdmin;
    
    if (!isCreator && !isAdmin) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Apenas o criador ou administradores podem excluir este workflow'
      );
    }
    
    // Excluir workflow
    await workflowEngine.deleteWorkflow(data.id);
    
    return {
      success: true,
      message: 'Workflow excluído com sucesso'
    };
  } catch (error) {
    functions.logger.error('Erro ao excluir workflow:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Erro interno ao excluir workflow',
      { error: String(error) }
    );
  }
});