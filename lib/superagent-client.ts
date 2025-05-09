/**
 * Cliente API do Superagent para o frontend Next.js
 */
import { auth } from '@clerk/nextjs';

export interface SuperagentResponse<T> {
  data: T;
  error?: string;
  status: number;
}

class SuperagentClient {
  private baseUrl: string;
  
  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_SUPERAGENT_API_URL || '';
    
    if (!this.baseUrl) {
      console.error('NEXT_PUBLIC_SUPERAGENT_API_URL não está definido nas variáveis de ambiente');
    }
  }

  /**
   * Obtém token de autenticação do Clerk
   */
  private async getAuthToken(): Promise<string> {
    try {
      const { getToken } = auth();
      return await getToken({ template: 'superagent' });
    } catch (error) {
      console.error('Falha ao obter token de autenticação:', error);
      throw new Error('Falha na autenticação');
    }
  }

  /**
   * Realiza uma requisição autenticada para a API do Superagent
   */
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<SuperagentResponse<T>> {
    try {
      // Obter token de autenticação
      const token = await this.getAuthToken();
      
      // Opções padrão da requisição
      const defaultOptions: RequestInit = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      };
      
      // Mesclar opções padrão com opções fornecidas
      const requestOptions: RequestInit = {
        ...defaultOptions,
        ...options,
        headers: {
          ...defaultOptions.headers,
          ...options.headers
        }
      };
      
      // Realizar a requisição para a API
      const response = await fetch(`${this.baseUrl}${endpoint}`, requestOptions);
      const data = await response.json();
      
      // Tratar erros da API
      if (!response.ok) {
        return {
          data: {} as T,
          error: data.message || 'Erro na requisição à API',
          status: response.status
        };
      }
      
      return { 
        data,
        status: response.status
      };
    } catch (error) {
      console.error(`Erro ao chamar ${endpoint}:`, error);
      throw error;
    }
  }

  // === Gerenciamento de Agentes ===
  
  /**
   * Obtém todos os agentes
   */
  async getAgents() {
    return this.request<any[]>('/api/v1/agents');
  }
  
  /**
   * Obtém um agente por ID
   */
  async getAgentById(agentId: string) {
    return this.request<any>(`/api/v1/agents/${agentId}`);
  }
  
  /**
   * Cria um novo agente
   */
  async createAgent(agentData: any) {
    return this.request<any>('/api/v1/agents', {
      method: 'POST',
      body: JSON.stringify(agentData)
    });
  }
  
  /**
   * Atualiza um agente existente
   */
  async updateAgent(agentId: string, agentData: any) {
    return this.request<any>(`/api/v1/agents/${agentId}`, {
      method: 'PUT',
      body: JSON.stringify(agentData)
    });
  }
  
  /**
   * Exclui um agente
   */
  async deleteAgent(agentId: string) {
    return this.request<any>(`/api/v1/agents/${agentId}`, {
      method: 'DELETE'
    });
  }
  
  // === Invocação de Agentes ===
  
  /**
   * Executa um agente com um prompt
   */
  async runAgent(agentId: string, input: any) {
    return this.request<any>(`/api/v1/agents/${agentId}/invoke`, {
      method: 'POST',
      body: JSON.stringify({ input })
    });
  }
  
  // === Gerenciamento de Documentos ===
  
  /**
   * Faz upload de um documento
   */
  async uploadDocument(file: File) {
    const token = await this.getAuthToken();
    
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${this.baseUrl}/api/v1/documents`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return {
        data: {},
        error: data.message || 'Falha ao fazer upload do documento',
        status: response.status
      };
    }
    
    return {
      data,
      status: response.status
    };
  }
  
  /**
   * Obtém todos os documentos
   */
  async getDocuments() {
    return this.request<any[]>('/api/v1/documents');
  }
}

// Criar e exportar uma instância singleton
const superagentClient = new SuperagentClient();
export default superagentClient;