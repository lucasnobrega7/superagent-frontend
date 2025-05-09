import { auth } from '@clerk/nextjs';

/**
 * Cliente de API para comunicação com o backend
 * Inclui automaticamente autenticação e tratamento de erros
 */
class ApiClient {
  private baseUrl: string;

  constructor() {
    // Definir baseUrl com base no ambiente
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  }

  /**
   * Fazer uma requisição GET com autenticação
   */
  async get<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
      ...options
    });
  }

  /**
   * Fazer uma requisição POST com autenticação
   */
  async post<T>(endpoint: string, data: any, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options
    });
  }

  /**
   * Fazer uma requisição PUT com autenticação
   */
  async put<T>(endpoint: string, data: any, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options
    });
  }

  /**
   * Fazer uma requisição DELETE com autenticação
   */
  async delete<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      ...options
    });
  }

  /**
   * Método base para realizar requisições
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // Adicionar barras ao endpoint se necessário
    const url = endpoint.startsWith('http')
      ? endpoint
      : `${this.baseUrl}/${endpoint.startsWith('/') ? endpoint.substring(1) : endpoint}`;

    // Obter token de autenticação do Clerk
    let token: string | null = null;
    try {
      const { getToken } = auth();
      token = await getToken();
    } catch (error) {
      console.warn('Erro ao obter token de autenticação:', error);
    }

    // Configurar cabeçalhos
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    };

    // Fazer a requisição
    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      // Verificar se a resposta foi bem-sucedida
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          response.statusText,
          response.status,
          errorData
        );
      }

      // Verificar se há conteúdo para retornar
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return await response.json() as T;
      } else if (contentType?.includes('text/')) {
        return await response.text() as unknown as T;
      } else {
        return {} as T;
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError(
        (error as Error).message || 'Erro desconhecido',
        500,
        {}
      );
    }
  }
}

/**
 * Classe de erro para API
 */
export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Exportar instância para uso em toda a aplicação
export const apiClient = new ApiClient();