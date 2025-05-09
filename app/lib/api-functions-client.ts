// Cliente alternativo para Firebase Functions usando fetch API
// Isso evita problemas com o Firebase SDK no Next.js

import axios from 'axios';

// URL base das funções
const FUNCTIONS_BASE_URL = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL || 
                          'https://us-central1-sabrinaai-2a39e.cloudfunctions.net';

// Interface para dados do agente
export interface Agent {
  id: string;
  name: string;
  description: string;
  isPublic?: boolean;
  initialMessage?: string;
  llmModel?: string;
  createdAt: string;
}

// Interface para criação de agente
export interface AgentInput {
  name: string;
  description: string;
  isPublic?: boolean;
  initialMessage?: string;
  llmModel?: string;
}

// Interface para LLM Model
export interface LLMModel {
  id: string;
  provider: string;
  model: string;
  apiKey?: string;
}

// Interface para Datasource
export interface Datasource {
  id: string;
  name: string;
  description: string;
  type: string;
}

// Interface para Tool
export interface Tool {
  id: string;
  name: string;
  description: string;
  type: string;
}

// Cliente para API Functions
const ApiFunctionsClient = {
  // Helper para fazer chamadas HTTP para as funções
  _callFunction: async (functionName: string, data?: any) => {
    try {
      const response = await axios.post(
        `${FUNCTIONS_BASE_URL}/${functionName}`, 
        { data },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Erro ao chamar função ${functionName}:`, error);
      throw error;
    }
  },

  // Listar agentes
  listAgents: async (): Promise<Agent[]> => {
    try {
      const result = await ApiFunctionsClient._callFunction('listAgents');
      return result.result.agents || [];
    } catch (error) {
      console.error('Erro ao listar agentes:', error);
      throw error;
    }
  },

  // Criar agente
  createAgent: async (agentData: AgentInput): Promise<Agent> => {
    try {
      const result = await ApiFunctionsClient._callFunction('createAgent', agentData);
      if (result.result.error) {
        throw new Error(result.result.error);
      }
      return result.result.agent;
    } catch (error) {
      console.error('Erro ao criar agente:', error);
      throw error;
    }
  },

  // Obter dados analíticos
  getAnalyticsData: async () => {
    try {
      const result = await ApiFunctionsClient._callFunction('getAnalyticsData');
      return result.result;
    } catch (error) {
      console.error('Erro ao obter dados analíticos:', error);
      throw error;
    }
  },

  // Testar API externa
  testExternalApi: async () => {
    try {
      const result = await ApiFunctionsClient._callFunction('testExternalApi');
      return result.result;
    } catch (error) {
      console.error('Erro ao testar API externa:', error);
      throw error;
    }
  },

  // Hello World (função de teste básica)
  helloWorld: async () => {
    try {
      const result = await ApiFunctionsClient._callFunction('helloWorld');
      return result.result;
    } catch (error) {
      console.error('Erro ao executar helloWorld:', error);
      throw error;
    }
  },

  // Listar LLMs
  listLLMs: async (): Promise<LLMModel[]> => {
    try {
      const result = await ApiFunctionsClient._callFunction('listLLMs');
      return result.result.llms || [];
    } catch (error) {
      console.error('Erro ao listar LLMs:', error);
      throw error;
    }
  },

  // Criar LLM
  createLLM: async (llmData: { provider: string, model: string, apiKey?: string }): Promise<LLMModel> => {
    try {
      const result = await ApiFunctionsClient._callFunction('createLLM', llmData);
      if (result.result.error) {
        throw new Error(result.result.error);
      }
      return result.result.llm;
    } catch (error) {
      console.error('Erro ao criar LLM:', error);
      throw error;
    }
  },

  // Listar datasources
  listDatasources: async (): Promise<Datasource[]> => {
    try {
      const result = await ApiFunctionsClient._callFunction('listDatasources');
      return result.result.datasources || [];
    } catch (error) {
      console.error('Erro ao listar datasources:', error);
      throw error;
    }
  },

  // Upload de arquivo
  uploadFile: async (file: File, name: string, description: string): Promise<Datasource> => {
    try {
      // Criar um FormData para enviar o arquivo
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', name);
      formData.append('description', description);

      // Enviar via axios com formData
      const response = await axios.post(
        `${FUNCTIONS_BASE_URL}/uploadFile`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.result.error) {
        throw new Error(response.data.result.error);
      }
      
      return response.data.result.datasource;
    } catch (error) {
      console.error('Erro ao fazer upload de arquivo:', error);
      throw error;
    }
  },

  // Listar tools
  listTools: async (): Promise<Tool[]> => {
    try {
      const result = await ApiFunctionsClient._callFunction('listTools');
      return result.result.tools || [];
    } catch (error) {
      console.error('Erro ao listar tools:', error);
      throw error;
    }
  },

  // Invocar agente
  invokeAgent: async ({ id, input, sessionId }: { id: string, input: string, sessionId: string }) => {
    try {
      const result = await ApiFunctionsClient._callFunction('invokeAgent', { id, input, sessionId });
      if (result.result.error) {
        throw new Error(result.result.error);
      }
      return result.result;
    } catch (error) {
      console.error('Erro ao invocar agente:', error);
      throw error;
    }
  }
};

export default ApiFunctionsClient;