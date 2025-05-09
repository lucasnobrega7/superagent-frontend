/**
 * Service for interacting with the Superagent API
 */
import axios, { AxiosInstance } from "axios";
import { logger } from "firebase-functions";
import FormData from "form-data";

interface SuperagentConfig {
  apiUrl: string;
  apiKey: string;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  isPublic?: boolean;
  initialMessage?: string;
  llmModel?: string;
  createdAt: string;
}

export interface LLMModel {
  id: string;
  provider: string;
  model: string;
  apiKey?: string;
}

export interface Datasource {
  id: string;
  name: string;
  description: string;
  type: string;
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  type: string;
}

export class SuperagentService {
  private client!: AxiosInstance; // Usando o operador ! para evitar erro de não inicialização
  private isInitialized: boolean = false;

  constructor(private config?: SuperagentConfig) {
    this.initialize();
  }

  /**
   * Initialize the service with API configuration
   */
  initialize(config?: SuperagentConfig): void {
    // Use provided config or environment variables
    this.config = config || {
      apiUrl: process.env.SUPERAGENT_API_URL || "https://api.superagent.sh",
      apiKey: process.env.SUPERAGENT_API_KEY || ""
    };

    // Create axios instance with pre-configured settings
    this.client = axios.create({
      baseURL: this.config.apiUrl,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.config.apiKey}`
      }
    });

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      response => response,
      error => {
        logger.error("Superagent API error:", {
          status: error.response?.status,
          message: error.message,
          data: error.response?.data
        });
        return Promise.reject(error);
      }
    );

    this.isInitialized = true;
    logger.info("Superagent service initialized", { url: this.config.apiUrl });
  }

  /**
   * Ensure the service is initialized
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      this.initialize();
    }
    
    if (!this.config?.apiKey) {
      throw new Error("Superagent API key not configured");
    }
  }

  /**
   * List all agents
   */
  async listAgents(): Promise<Agent[]> {
    this.ensureInitialized();
    
    try {
      const response = await this.client.get("/agents");
      return response.data || [];
    } catch (error) {
      logger.error("Failed to list agents", error);
      return [];
    }
  }

  /**
   * Create a new agent
   */
  async createAgent(data: {
    name: string;
    description: string;
    initialMessage?: string;
    llmModel?: string;
    isPublic?: boolean;
  }): Promise<Agent> {
    this.ensureInitialized();
    
    try {
      // Map to Superagent API format
      const payload = {
        name: data.name,
        description: data.description,
        initial_message: data.initialMessage,
        llm: data.llmModel,
        is_public: data.isPublic,
      };
      
      const response = await this.client.post("/agents", payload);
      
      // Format response to match our interface
      return {
        id: response.data.id,
        name: response.data.name,
        description: response.data.description,
        initialMessage: response.data.initial_message,
        llmModel: response.data.llm,
        isPublic: response.data.is_public,
        createdAt: response.data.created_at || new Date().toISOString()
      };
    } catch (error) {
      logger.error("Failed to create agent", error);
      throw error;
    }
  }

  /**
   * List LLM models
   */
  async listLLMs(): Promise<LLMModel[]> {
    this.ensureInitialized();
    
    try {
      const response = await this.client.get("/llms");
      
      // Format response to match our interface
      return (response.data || []).map((llm: any) => ({
        id: llm.id,
        provider: llm.provider,
        model: llm.model,
        apiKey: "••••••••" // Don't return actual API key
      }));
    } catch (error) {
      logger.error("Failed to list LLMs", error);
      return [];
    }
  }

  /**
   * Create a new LLM
   */
  async createLLM(data: {
    provider: string;
    model: string;
    apiKey?: string;
  }): Promise<LLMModel> {
    this.ensureInitialized();
    
    try {
      // Map to Superagent API format
      const payload = {
        provider: data.provider,
        model: data.model,
        api_key: data.apiKey
      };
      
      const response = await this.client.post("/llms", payload);
      
      // Format response to match our interface
      return {
        id: response.data.id,
        provider: response.data.provider,
        model: response.data.model,
        apiKey: "••••••••" // Don't return actual API key
      };
    } catch (error) {
      logger.error("Failed to create LLM", error);
      throw error;
    }
  }

  /**
   * List datasources
   */
  async listDatasources(): Promise<Datasource[]> {
    this.ensureInitialized();
    
    try {
      const response = await this.client.get("/datasources");
      
      // Format response to match our interface
      return (response.data || []).map((ds: any) => ({
        id: ds.id,
        name: ds.name,
        description: ds.description || "",
        type: ds.type
      }));
    } catch (error) {
      logger.error("Failed to list datasources", error);
      return [];
    }
  }

  /**
   * Upload file to create a datasource
   */
  async uploadFile(
    file: Buffer,
    filename: string,
    options: {
      name: string;
      description?: string;
    }
  ): Promise<Datasource> {
    this.ensureInitialized();
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append("file", file, filename);
      formData.append("name", options.name);
      
      if (options.description) {
        formData.append("description", options.description);
      }
      
      // Send request with form data
      const response = await this.client.post("/datasources/upload", formData, {
        headers: {
          ...formData.getHeaders(),
          "Authorization": `Bearer ${this.config?.apiKey}`
        }
      });
      
      // Format response to match our interface
      return {
        id: response.data.id,
        name: response.data.name,
        description: response.data.description || "",
        type: response.data.type
      };
    } catch (error) {
      logger.error("Failed to upload file", error);
      throw error;
    }
  }

  /**
   * List tools
   */
  async listTools(): Promise<Tool[]> {
    this.ensureInitialized();
    
    try {
      const response = await this.client.get("/tools");
      
      // Format response to match our interface
      return (response.data || []).map((tool: any) => ({
        id: tool.id,
        name: tool.name,
        description: tool.description || "",
        type: tool.type
      }));
    } catch (error) {
      logger.error("Failed to list tools", error);
      return [];
    }
  }

  /**
   * Invoke an agent with a prompt
   */
  async invokeAgent(agentId: string, input: string, sessionId?: string): Promise<any> {
    this.ensureInitialized();

    try {
      const payload = {
        input: { text: input },
        session_id: sessionId
      };

      const response = await this.client.post(`/agents/${agentId}/invoke`, payload);

      // Prevenção do erro RangeError: Invalid string length
      // Limitando o tamanho da resposta para evitar problemas com strings muito grandes
      const safeData = {
        ...response.data,
        output: this.truncateString(response.data.output || "", 100000),
        text: this.truncateString(response.data.text || "", 100000)
      };

      return safeData;
    } catch (error) {
      logger.error(`Failed to invoke agent ${agentId}`, error);
      throw error;
    }
  }

  /**
   * Utilitário para truncar strings muito longas
   */
  private truncateString(str: string, maxLength: number): string {
    if (str.length <= maxLength) {
      return str;
    }

    logger.warn(`Truncating large string response from ${str.length} to ${maxLength} characters`);
    return str.substring(0, maxLength) + `... [Conteúdo truncado - Tamanho original: ${str.length} caracteres]`;
  }
}

// Export singleton instance
export const superagentService = new SuperagentService();