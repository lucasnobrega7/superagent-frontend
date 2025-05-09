import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from './firebase';

// Initialize Firebase Functions
const functions = getFunctions(app);

// Endpoints
export const listAgentsFunction = httpsCallable(functions, 'listAgents');
export const createAgentFunction = httpsCallable(functions, 'createAgent');
export const getAnalyticsDataFunction = httpsCallable(functions, 'getAnalyticsData');
export const testExternalApiFunction = httpsCallable(functions, 'testExternalApi');
export const helloWorldFunction = httpsCallable(functions, 'helloWorld');

// Interface para dados do agente
export interface Agent {
  id: string;
  name: string;
  description: string;
  isPublic?: boolean;
  createdAt: string;
}

// Interface para criação de agente
export interface AgentInput {
  name: string;
  description: string;
  isPublic?: boolean;
}

// Cliente para Firebase Functions
const FirebaseFunctionsClient = {
  // Listar agentes
  listAgents: async (): Promise<Agent[]> => {
    try {
      const result = await listAgentsFunction();
      return (result.data as any)?.agents || [];
    } catch (error) {
      console.error('Erro ao listar agentes:', error);
      throw error;
    }
  },

  // Criar agente
  createAgent: async (agentData: AgentInput): Promise<Agent> => {
    try {
      const result = await createAgentFunction(agentData);
      const data = result.data as any;
      if (data?.error) {
        throw new Error(data.error);
      }
      return data.agent;
    } catch (error) {
      console.error('Erro ao criar agente:', error);
      throw error;
    }
  },

  // Obter dados analíticos
  getAnalyticsData: async () => {
    try {
      const result = await getAnalyticsDataFunction();
      return result.data as any;
    } catch (error) {
      console.error('Erro ao obter dados analíticos:', error);
      throw error;
    }
  },

  // Testar API externa
  testExternalApi: async () => {
    try {
      const result = await testExternalApiFunction();
      return result.data as any;
    } catch (error) {
      console.error('Erro ao testar API externa:', error);
      throw error;
    }
  },

  // Hello World (função de teste básica)
  helloWorld: async () => {
    try {
      const result = await helloWorldFunction();
      return result.data as any;
    } catch (error) {
      console.error('Erro ao executar helloWorld:', error);
      throw error;
    }
  }
};

export default FirebaseFunctionsClient;