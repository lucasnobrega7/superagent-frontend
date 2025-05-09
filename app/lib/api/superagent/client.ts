/**
 * Cliente para comunicação com a API do Superagent
 */
class SuperagentClient {
  private baseUrl: string;
  private apiKey: string | null;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_SUPERAGENT_API_URL || 'http://localhost:8000/api';
    this.apiKey = process.env.NEXT_PUBLIC_SUPERAGENT_API_KEY || null;
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

  // ********* AGENTES *********

  /**
   * Listar todos os agentes
   */
  async listAgents() {
    return this.request('/agents');
  }

  /**
   * Obter detalhes de um agente
   */
  async getAgent(agentId: string) {
    return this.request(`/agents/${agentId}`);
  }

  /**
   * Criar um novo agente
   */
  async createAgent(data: {
    name: string;
    description: string;
    llm: string;
    tools?: string[];
    metadata?: any;
  }) {
    return this.request('/agents', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * Atualizar um agente
   */
  async updateAgent(agentId: string, data: {
    name?: string;
    description?: string;
    llm?: string;
    tools?: string[];
    metadata?: any;
  }) {
    return this.request(`/agents/${agentId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  /**
   * Excluir um agente
   */
  async deleteAgent(agentId: string) {
    return this.request(`/agents/${agentId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Invocar um agente (enviar mensagem)
   */
  async invokeAgent(agentId: string, input: any, options?: { conversationId?: string }) {
    return this.request(`/agents/${agentId}/invoke`, {
      method: 'POST',
      body: JSON.stringify({
        input,
        conversation_id: options?.conversationId
      })
    });
  }

  /**
   * Enviar mensagem para o agente (para chat)
   */
  async sendMessage(agentId: string, message: string, conversationId?: string) {
    return this.invokeAgent(agentId, { text: message }, { conversationId });
  }

  /**
   * Adicionar um LLM a um agente
   */
  async addLlmToAgent(agentId: string, llmId: string) {
    return this.request(`/agents/${agentId}/llm`, {
      method: 'POST',
      body: JSON.stringify({
        llm_id: llmId
      })
    });
  }

  /**
   * Remover um LLM de um agente
   */
  async removeLlmFromAgent(agentId: string, llmId: string) {
    return this.request(`/agents/${agentId}/llm/${llmId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Listar ferramentas de um agente
   */
  async listAgentTools(agentId: string) {
    return this.request(`/agents/${agentId}/tools`);
  }

  /**
   * Adicionar uma ferramenta a um agente
   */
  async addToolToAgent(agentId: string, toolId: string) {
    return this.request(`/agents/${agentId}/tools`, {
      method: 'POST',
      body: JSON.stringify({
        tool_id: toolId
      })
    });
  }

  /**
   * Remover uma ferramenta de um agente
   */
  async removeToolFromAgent(agentId: string, toolId: string) {
    return this.request(`/agents/${agentId}/tools/${toolId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Listar fontes de dados de um agente
   */
  async listAgentDatasources(agentId: string) {
    return this.request(`/agents/${agentId}/datasources`);
  }

  /**
   * Adicionar uma fonte de dados a um agente
   */
  async addDatasourceToAgent(agentId: string, datasourceId: string) {
    return this.request(`/agents/${agentId}/datasources`, {
      method: 'POST',
      body: JSON.stringify({
        datasource_id: datasourceId
      })
    });
  }

  /**
   * Remover uma fonte de dados de um agente
   */
  async removeDatasourceFromAgent(agentId: string, datasourceId: string) {
    return this.request(`/agents/${agentId}/datasources/${datasourceId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Exportar configuração do agente
   */
  async exportAgentConfig(agentId: string) {
    return this.request(`/agents/${agentId}/export`);
  }

  /**
   * Importar configuração do agente
   */
  async importAgentConfig(config: any) {
    return this.request('/agents/import', {
      method: 'POST',
      body: JSON.stringify(config)
    });
  }

  // ********* LLMs *********

  /**
   * Listar todos os LLMs
   */
  async listLLMs() {
    return this.request('/llms');
  }

  /**
   * Obter detalhes de um LLM
   */
  async getLLM(llmId: string) {
    return this.request(`/llms/${llmId}`);
  }

  /**
   * Criar um novo LLM
   */
  async createLLM(data: {
    provider: string;
    model: string;
    api_key?: string;
    options?: any;
  }) {
    return this.request('/llms', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * Atualizar um LLM
   */
  async updateLLM(llmId: string, data: {
    provider?: string;
    model?: string;
    api_key?: string;
    options?: any;
  }) {
    return this.request(`/llms/${llmId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  // ********* API USERS *********

  /**
   * Criar um usuário de API
   */
  async createAPIUser(data: {
    email: string;
    metadata?: any;
  }) {
    return this.request('/api-users', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * Obter detalhes de um usuário de API
   */
  async getAPIUser(userId: string) {
    return this.request(`/api-users/${userId}`);
  }

  /**
   * Excluir um usuário de API
   */
  async deleteAPIUser(userId: string) {
    return this.request(`/api-users/${userId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Identificar um usuário de API
   */
  async identifyAPIUser(data: {
    email: string;
  }) {
    return this.request('/api-users/identify', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // ********* API KEYS *********

  /**
   * Listar todas as chaves de API
   */
  async listAPIKeys() {
    return this.request('/api-keys');
  }

  /**
   * Criar uma nova chave de API
   */
  async createAPIKey(data: {
    api_user_id: string;
    metadata?: any;
  }) {
    return this.request('/api-keys', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * Excluir uma chave de API
   */
  async deleteAPIKey(keyId: string) {
    return this.request(`/api-keys/${keyId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Atualizar uma chave de API
   */
  async updateAPIKey(keyId: string, data: {
    metadata?: any;
  }) {
    return this.request(`/api-keys/${keyId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  // ********* DATASOURCES *********

  /**
   * Listar todas as fontes de dados
   */
  async listDatasources() {
    return this.request('/datasources');
  }

  /**
   * Criar uma nova fonte de dados
   */
  async createDatasource(data: {
    name: string;
    description: string;
    type: string;
    config: any;
    metadata?: any;
  }) {
    return this.request('/datasources', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * Obter detalhes de uma fonte de dados
   */
  async getDatasource(datasourceId: string) {
    return this.request(`/datasources/${datasourceId}`);
  }

  /**
   * Excluir uma fonte de dados
   */
  async deleteDatasource(datasourceId: string) {
    return this.request(`/datasources/${datasourceId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Atualizar uma fonte de dados
   */
  async updateDatasource(datasourceId: string, data: {
    name?: string;
    description?: string;
    type?: string;
    config?: any;
    metadata?: any;
  }) {
    return this.request(`/datasources/${datasourceId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  // ********* TOOLS *********

  /**
   * Listar todas as ferramentas
   */
  async listTools() {
    return this.request('/tools');
  }

  /**
   * Criar uma nova ferramenta
   */
  async createTool(data: {
    name: string;
    description: string;
    type: string;
    config: any;
    metadata?: any;
  }) {
    return this.request('/tools', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * Obter detalhes de uma ferramenta
   */
  async getTool(toolId: string) {
    return this.request(`/tools/${toolId}`);
  }

  /**
   * Excluir uma ferramenta
   */
  async deleteTool(toolId: string) {
    return this.request(`/tools/${toolId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Atualizar uma ferramenta
   */
  async updateTool(toolId: string, data: {
    name?: string;
    description?: string;
    type?: string;
    config?: any;
    metadata?: any;
  }) {
    return this.request(`/tools/${toolId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  // ********* WORKFLOWS *********

  /**
   * Listar todos os fluxos de trabalho
   */
  async listWorkflows() {
    return this.request('/workflows');
  }

  /**
   * Criar um novo fluxo de trabalho
   */
  async createWorkflow(data: {
    name: string;
    description: string;
    metadata?: any;
  }) {
    return this.request('/workflows', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * Obter detalhes de um fluxo de trabalho
   */
  async getWorkflow(workflowId: string) {
    return this.request(`/workflows/${workflowId}`);
  }

  /**
   * Excluir um fluxo de trabalho
   */
  async deleteWorkflow(workflowId: string) {
    return this.request(`/workflows/${workflowId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Atualizar um fluxo de trabalho
   */
  async updateWorkflow(workflowId: string, data: {
    name?: string;
    description?: string;
    metadata?: any;
  }) {
    return this.request(`/workflows/${workflowId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  /**
   * Invocar um fluxo de trabalho
   */
  async invokeWorkflow(workflowId: string, input: any) {
    return this.request(`/workflows/${workflowId}/invoke`, {
      method: 'POST',
      body: JSON.stringify({
        input
      })
    });
  }

  /**
   * Listar etapas de um fluxo de trabalho
   */
  async listWorkflowSteps(workflowId: string) {
    return this.request(`/workflows/${workflowId}/steps`);
  }

  /**
   * Adicionar uma etapa a um fluxo de trabalho
   */
  async addStepToWorkflow(workflowId: string, data: {
    name: string;
    description: string;
    input: any;
    output: any;
    order: number;
    agent_id?: string;
    tool_id?: string;
    llm_id?: string;
    metadata?: any;
  }) {
    return this.request(`/workflows/${workflowId}/steps`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * Excluir uma etapa de um fluxo de trabalho
   */
  async deleteWorkflowStep(workflowId: string, stepId: string) {
    return this.request(`/workflows/${workflowId}/steps/${stepId}`, {
      method: 'DELETE'
    });
  }

  // ********* WORKFLOW CONFIG *********

  /**
   * Obter esquema de configuração de fluxo de trabalho
   */
  async getWorkflowConfigSchema() {
    return this.request('/workflow-configs/schema');
  }

  /**
   * Adicionar configuração a um fluxo de trabalho
   */
  async addWorkflowConfig(data: {
    workflow_id: string;
    config: any;
  }) {
    return this.request('/workflow-configs', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // ********* VECTOR DATABASES *********

  /**
   * Listar todos os bancos de dados vetoriais
   */
  async listVectorDatabases() {
    return this.request('/vector-databases');
  }

  /**
   * Criar um novo banco de dados vetorial
   */
  async createVectorDatabase(data: {
    name: string;
    description: string;
    provider: string;
    config: any;
    metadata?: any;
  }) {
    return this.request('/vector-databases', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * Obter detalhes de um banco de dados vetorial
   */
  async getVectorDatabase(databaseId: string) {
    return this.request(`/vector-databases/${databaseId}`);
  }

  /**
   * Excluir um banco de dados vetorial
   */
  async deleteVectorDatabase(databaseId: string) {
    return this.request(`/vector-databases/${databaseId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Atualizar um banco de dados vetorial
   */
  async updateVectorDatabase(databaseId: string, data: {
    name?: string;
    description?: string;
    provider?: string;
    config?: any;
    metadata?: any;
  }) {
    return this.request(`/vector-databases/${databaseId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  // ********* KNOWLEDGE *********

  /**
   * Listar o conhecimento de um agente
   */
  async listAgentKnowledge(agentId: string) {
    return this.request(`/agents/${agentId}/knowledge`);
  }

  /**
   * Adicionar conhecimento a um agente (texto)
   */
  async addTextKnowledge(agentId: string, content: string, metadata?: any) {
    return this.request(`/agents/${agentId}/knowledge`, {
      method: 'POST',
      body: JSON.stringify({
        type: 'text',
        content,
        metadata
      })
    });
  }

  /**
   * Adicionar conhecimento a um agente (URL)
   */
  async addUrlKnowledge(agentId: string, url: string, metadata?: any) {
    return this.request(`/agents/${agentId}/knowledge`, {
      method: 'POST',
      body: JSON.stringify({
        type: 'url',
        content: url,
        metadata
      })
    });
  }

  /**
   * Adicionar conhecimento a um agente (arquivo)
   */
  async addFileKnowledge(agentId: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.request(`/agents/${agentId}/knowledge/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        // Não incluir Content-Type para que o navegador defina o boundary correto
        'Accept': 'application/json',
        'Authorization': this.apiKey ? `Bearer ${this.apiKey}` : ''
      }
    }, true);
  }

  /**
   * Excluir conhecimento de um agente
   */
  async deleteKnowledge(agentId: string, knowledgeId: string) {
    return this.request(`/agents/${agentId}/knowledge/${knowledgeId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Método base para fazer requisições 
   */
  private async request(endpoint: string, options: RequestInit = {}, isFormData = false) {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Configurar cabeçalhos padrão
    const headers: HeadersInit = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
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
        throw new SuperagentError(
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
      if (error instanceof SuperagentError) {
        throw error;
      }
      
      throw new SuperagentError(
        (error as Error).message || 'Erro desconhecido',
        500,
        {}
      );
    }
  }
}

/**
 * Classe de erro para o cliente Superagent
 */
export class SuperagentError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data: any) {
    super(message);
    this.name = 'SuperagentError';
    this.status = status;
    this.data = data;
  }
}

// Exportar instância para uso em toda a aplicação
export const superagentClient = new SuperagentClient();