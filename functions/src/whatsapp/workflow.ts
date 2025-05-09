/**
 * WhatsApp Sales Agent Workflow Engine
 * Implementa um motor de workflow para agentes de vendas no WhatsApp
 */
import { logger } from 'firebase-functions';
import { v4 as uuidv4 } from 'uuid';
import * as admin from 'firebase-admin';
import { z } from 'zod';

// Schemas de validação
export const NodeSchema = z.object({
  id: z.string(),
  type: z.enum(['message', 'condition', 'delay', 'input', 'integration', 'end']),
  content: z.record(z.any()),
  next: z.array(z.object({
    id: z.string(),
    condition: z.string().optional()
  })).optional()
});

export const WorkflowSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  nodes: z.array(NodeSchema),
  startNodeId: z.string(),
  isPublic: z.boolean().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  version: z.number().default(1),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional()
});

// Tipos gerados a partir dos schemas
export type Node = z.infer<typeof NodeSchema>;
export type Workflow = z.infer<typeof WorkflowSchema>;

// Interface para contexto de execução do workflow
export interface WorkflowContext {
  workflowId: string;
  sessionId: string;
  phone: string;
  input?: string;
  variables: Record<string, any>;
  history: Array<{
    nodeId: string;
    timestamp: number;
    input?: string;
    output?: string;
  }>;
  currentNodeId?: string;
  lastNodeId?: string;
  metadata: Record<string, any>;
}

// Opções de execução
export interface WorkflowExecuteOptions {
  input?: string;
  variables?: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Motor de Workflow para gerenciar fluxos de agentes de vendas
 */
export class WorkflowEngine {
  private db: admin.firestore.Firestore;

  constructor() {
    this.db = admin.firestore();
  }

  /**
   * Cria um novo workflow
   */
  async createWorkflow(workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>): Promise<Workflow> {
    try {
      const now = new Date().toISOString();
      const newWorkflow: Workflow = {
        ...workflow,
        id: uuidv4(),
        createdAt: now,
        updatedAt: now,
        version: 1,
        isPublic: workflow.isPublic || false
      };

      // Validar o workflow
      const validatedWorkflow = WorkflowSchema.parse(newWorkflow);

      // Salvar no Firestore
      await this.db.collection('workflows').doc(validatedWorkflow.id).set(validatedWorkflow);

      return validatedWorkflow;
    } catch (error) {
      logger.error('Erro ao criar workflow:', error);
      throw error;
    }
  }

  /**
   * Obtém um workflow pelo ID
   */
  async getWorkflow(id: string): Promise<Workflow | null> {
    try {
      const doc = await this.db.collection('workflows').doc(id).get();
      if (!doc.exists) {
        return null;
      }

      return doc.data() as Workflow;
    } catch (error) {
      logger.error(`Erro ao buscar workflow ${id}:`, error);
      throw error;
    }
  }

  /**
   * Lista workflows com opções de filtragem
   */
  async listWorkflows(options: {
    isPublic?: boolean;
    tags?: string[];
    limit?: number;
  } = {}): Promise<Workflow[]> {
    try {
      let query = this.db.collection('workflows') as FirebaseFirestore.Query;

      // Aplicar filtros
      if (options.isPublic !== undefined) {
        query = query.where('isPublic', '==', options.isPublic);
      }

      if (options.tags && options.tags.length > 0) {
        query = query.where('tags', 'array-contains-any', options.tags);
      }

      // Aplicar limite
      if (options.limit) {
        query = query.limit(options.limit);
      }

      // Executar query
      const snapshot = await query.get();
      return snapshot.docs.map(doc => doc.data() as Workflow);
    } catch (error) {
      logger.error('Erro ao listar workflows:', error);
      throw error;
    }
  }

  /**
   * Atualiza um workflow existente
   */
  async updateWorkflow(id: string, updates: Partial<Workflow>): Promise<Workflow> {
    try {
      const workflow = await this.getWorkflow(id);
      if (!workflow) {
        throw new Error(`Workflow ${id} não encontrado`);
      }

      // Mesclar atualizações com dados existentes
      const updatedWorkflow: Workflow = {
        ...workflow,
        ...updates,
        id, // Garantir que o ID não seja alterado
        updatedAt: new Date().toISOString(),
        version: (workflow.version || 1) + 1
      };

      // Validar o workflow atualizado
      const validatedWorkflow = WorkflowSchema.parse(updatedWorkflow);

      // Salvar no Firestore
      await this.db.collection('workflows').doc(id).set(validatedWorkflow);

      return validatedWorkflow;
    } catch (error) {
      logger.error(`Erro ao atualizar workflow ${id}:`, error);
      throw error;
    }
  }

  /**
   * Exclui um workflow pelo ID
   */
  async deleteWorkflow(id: string): Promise<boolean> {
    try {
      await this.db.collection('workflows').doc(id).delete();
      return true;
    } catch (error) {
      logger.error(`Erro ao excluir workflow ${id}:`, error);
      throw error;
    }
  }

  /**
   * Inicia uma nova sessão de execução do workflow
   */
  async startSession(workflowId: string, phone: string, options: WorkflowExecuteOptions = {}): Promise<WorkflowContext> {
    try {
      const workflow = await this.getWorkflow(workflowId);
      if (!workflow) {
        throw new Error(`Workflow ${workflowId} não encontrado`);
      }

      const sessionId = uuidv4();
      const now = Date.now();

      // Criar contexto inicial
      const context: WorkflowContext = {
        workflowId,
        sessionId,
        phone,
        variables: options.variables || {},
        history: [],
        metadata: options.metadata || {},
        currentNodeId: workflow.startNodeId
      };

      // Salvar sessão no Firestore
      await this.db.collection('workflow_sessions').doc(sessionId).set({
        ...context,
        createdAt: now,
        updatedAt: now,
        isActive: true
      });

      return context;
    } catch (error) {
      logger.error(`Erro ao iniciar sessão para workflow ${workflowId}:`, error);
      throw error;
    }
  }

  /**
   * Executa o próximo passo do workflow para uma sessão
   */
  async executeStep(sessionId: string, input?: string): Promise<{
    output: string | null;
    isComplete: boolean;
    nextNodeType?: string;
    waitForInput?: boolean;
  }> {
    try {
      // Obter dados da sessão
      const sessionDoc = await this.db.collection('workflow_sessions').doc(sessionId).get();
      if (!sessionDoc.exists) {
        throw new Error(`Sessão ${sessionId} não encontrada`);
      }

      const session = sessionDoc.data() as WorkflowContext & { 
        isActive: boolean;
        createdAt: number;
        updatedAt: number;
      };

      // Verificar se a sessão está ativa
      if (!session.isActive) {
        throw new Error(`Sessão ${sessionId} não está mais ativa`);
      }

      // Obter o workflow
      const workflow = await this.getWorkflow(session.workflowId);
      if (!workflow) {
        throw new Error(`Workflow ${session.workflowId} não encontrado`);
      }

      // Executar o nó atual
      const currentNodeId = session.currentNodeId;
      if (!currentNodeId) {
        throw new Error('Nó atual não definido na sessão');
      }

      // Encontrar o nó atual
      const currentNode = workflow.nodes.find(node => node.id === currentNodeId);
      if (!currentNode) {
        throw new Error(`Nó ${currentNodeId} não encontrado no workflow`);
      }

      // Processar diferentes tipos de nós
      let output: string | null = null;
      let nextNodeId: string | null = null;
      let isComplete = false;
      let waitForInput = false;

      // Registrar o input recebido no histórico
      if (input) {
        session.history.push({
          nodeId: currentNodeId,
          timestamp: Date.now(),
          input
        });
        session.input = input;
      }

      // Executar lógica específica do tipo de nó
      switch (currentNode.type) {
        case 'message':
          // Nó de mensagem - envia texto configurado
          output = currentNode.content.text || '';
          
          // Substituir variáveis no output se necessário
          if (output) {
            output = this.replaceVariables(output, session.variables);
          }
          
          // Encontrar próximo nó
          if (currentNode.next && currentNode.next.length > 0) {
            nextNodeId = currentNode.next[0].id;
          } else {
            isComplete = true;
          }
          break;

        case 'input':
          // Nó de entrada - aguarda input do usuário
          if (!input) {
            // Se não houver input, retorna a mensagem de prompt e aguarda
            output = currentNode.content.prompt || 'Aguardando sua resposta...';
            waitForInput = true;
          } else {
            // Se houver input, processa e atualiza variáveis
            const variableName = currentNode.content.variableName;
            if (variableName) {
              session.variables[variableName] = input;
            }
            
            // Encontrar próximo nó
            if (currentNode.next && currentNode.next.length > 0) {
              nextNodeId = currentNode.next[0].id;
            } else {
              isComplete = true;
            }
          }
          break;

        case 'condition':
          // Nó de condição - avalia uma condição para determinar o próximo nó
          if (currentNode.next && currentNode.next.length > 0) {
            // Avaliar cada condição
            for (const nextNode of currentNode.next) {
              if (!nextNode.condition) {
                // Sem condição significa caminho padrão
                nextNodeId = nextNode.id;
                break;
              }
              
              try {
                // Avaliar a condição usando variáveis da sessão
                const conditionResult = this.evaluateCondition(nextNode.condition, session.variables);
                if (conditionResult) {
                  nextNodeId = nextNode.id;
                  break;
                }
              } catch (error) {
                logger.warn(`Erro ao avaliar condição ${nextNode.condition}:`, error);
              }
            }
            
            // Se nenhuma condição for atendida, usar o último nó como fallback
            if (!nextNodeId && currentNode.next.length > 0) {
              nextNodeId = currentNode.next[currentNode.next.length - 1].id;
            }
          } else {
            isComplete = true;
          }
          break;

        case 'delay':
          // Nó de atraso - espera um tempo configurado antes de prosseguir
          // Como estamos executando de forma síncrona, apenas simulamos o atraso registrando-o
          const delayMs = currentNode.content.delayMs || 0;
          logger.info(`Simulando atraso de ${delayMs}ms no workflow ${session.workflowId}`);
          
          // Encontrar próximo nó
          if (currentNode.next && currentNode.next.length > 0) {
            nextNodeId = currentNode.next[0].id;
          } else {
            isComplete = true;
          }
          break;

        case 'integration':
          // Nó de integração - chama sistema externo (apenas simulado nesta versão)
          output = `Integração com ${currentNode.content.service || 'sistema externo'} executada`;
          
          // Encontrar próximo nó
          if (currentNode.next && currentNode.next.length > 0) {
            nextNodeId = currentNode.next[0].id;
          } else {
            isComplete = true;
          }
          break;

        case 'end':
          // Nó final do workflow
          output = currentNode.content.message || 'Fluxo finalizado';
          isComplete = true;
          break;

        default:
          logger.warn(`Tipo de nó desconhecido: ${currentNode.type}`);
          isComplete = true;
          break;
      }

      // Registrar resultado no histórico se houver output
      if (output) {
        session.history.push({
          nodeId: currentNodeId,
          timestamp: Date.now(),
          output
        });
      }

      // Atualizar sessão
      session.lastNodeId = currentNodeId;
      session.currentNodeId = nextNodeId || undefined;
      session.updatedAt = Date.now();

      // Marcar sessão como inativa se o workflow estiver completo
      if (isComplete) {
        session.isActive = false;
      }

      // Salvar atualização no Firestore
      await this.db.collection('workflow_sessions').doc(sessionId).set(session);

      // Retornar resultado da execução
      return {
        output,
        isComplete,
        nextNodeType: nextNodeId ? workflow.nodes.find(n => n.id === nextNodeId)?.type : undefined,
        waitForInput
      };
    } catch (error) {
      logger.error(`Erro ao executar passo da sessão ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Encerra uma sessão de workflow
   */
  async endSession(sessionId: string): Promise<boolean> {
    try {
      await this.db.collection('workflow_sessions').doc(sessionId).update({
        isActive: false,
        updatedAt: Date.now()
      });
      return true;
    } catch (error) {
      logger.error(`Erro ao encerrar sessão ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Avalia uma condição usando as variáveis disponíveis
   * Implementação simples e segura para expressões condicionais
   */
  private evaluateCondition(condition: string, variables: Record<string, any>): boolean {
    // Sanitiza a condição para evitar injeção de código
    const sanitizedCondition = condition
      .replace(/[^\w\s=!<>]/g, '') // Remove caracteres especiais exceto operadores básicos
      .trim();

    // Exemplos de condições suportadas:
    // "variavel == valor"
    // "variavel != valor"
    // "variavel > numero"
    // "variavel < numero"

    // Analisar a condição
    const operatorMatch = sanitizedCondition.match(/==|!=|>|<|>=|<=/) || ['=='];
    const operator = operatorMatch[0];
    
    const [left, right] = sanitizedCondition.split(operator).map(part => part.trim());
    
    // Obter valor da variável
    const leftValue = variables[left];
    let rightValue = right;
    
    // Converter para número se possível
    if (!isNaN(Number(rightValue))) {
      rightValue = Number(rightValue);
    }
    
    // Avaliar a condição
    switch (operator) {
      case '==': return leftValue == rightValue;
      case '!=': return leftValue != rightValue;
      case '>': return leftValue > rightValue;
      case '<': return leftValue < rightValue;
      case '>=': return leftValue >= rightValue;
      case '<=': return leftValue <= rightValue;
      default: return false;
    }
  }

  /**
   * Substitui variáveis em um texto usando a sintaxe {{variavel}}
   */
  private replaceVariables(text: string, variables: Record<string, any>): string {
    return text.replace(/\{\{([^}]+)\}\}/g, (match, variableName) => {
      const value = variables[variableName.trim()];
      return value !== undefined ? String(value) : match;
    });
  }
}