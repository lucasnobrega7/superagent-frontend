import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';

type ErrorType = 
  | 'UNAUTHORIZED' 
  | 'NOT_FOUND' 
  | 'BAD_REQUEST' 
  | 'RATE_LIMIT' 
  | 'INTERNAL_SERVER_ERROR'
  | 'SUPERAGENT_ERROR'
  | 'VALIDATION_ERROR';

interface ErrorOptions {
  cause?: unknown;
  statusCode?: number;
  type?: ErrorType;
}

/**
 * Classe de erro customizada para API
 */
export class ApiError extends Error {
  readonly statusCode: number;
  readonly type: ErrorType;
  readonly cause?: unknown;

  constructor(message: string, options: ErrorOptions = {}) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = options.statusCode || 500;
    this.type = options.type || 'INTERNAL_SERVER_ERROR';
    this.cause = options.cause;
  }
}

/**
 * Funções helper para criar erros específicos
 */
export const createUnauthorizedError = (message = 'Não autorizado', cause?: unknown) => {
  return new ApiError(message, { statusCode: 401, type: 'UNAUTHORIZED', cause });
};

export const createNotFoundError = (message = 'Recurso não encontrado', cause?: unknown) => {
  return new ApiError(message, { statusCode: 404, type: 'NOT_FOUND', cause });
};

export const createBadRequestError = (message = 'Requisição inválida', cause?: unknown) => {
  return new ApiError(message, { statusCode: 400, type: 'BAD_REQUEST', cause });
};

export const createValidationError = (message = 'Erro de validação', cause?: unknown) => {
  return new ApiError(message, { statusCode: 422, type: 'VALIDATION_ERROR', cause });
};

export const createRateLimitError = (message = 'Limite de requisições excedido', cause?: unknown) => {
  return new ApiError(message, { statusCode: 429, type: 'RATE_LIMIT', cause });
};

export const createSuperagentError = (message = 'Erro na API do Superagent', cause?: unknown) => {
  return new ApiError(message, { statusCode: 502, type: 'SUPERAGENT_ERROR', cause });
};

/**
 * HOF para tratar erros em rotas de API
 * Wrap para route handlers no Next.js App Router
 */
export const withErrorHandling = (
  handler: (req: Request, context?: any) => Promise<Response>
) => {
  return async (req: Request, context?: any): Promise<Response> => {
    try {
      return await handler(req, context);
    } catch (error) {
      console.error('API Error:', error);
      
      // Tratar ApiError
      if (error instanceof ApiError) {
        return NextResponse.json(
          { 
            error: error.type, 
            message: error.message,
            ...(process.env.NODE_ENV === 'development' && error.cause 
               ? { cause: String(error.cause) } 
               : {})
          },
          { status: error.statusCode }
        );
      }
      
      // Tratar outros erros
      return NextResponse.json(
        { 
          error: 'INTERNAL_SERVER_ERROR', 
          message: 'Erro interno do servidor',
          ...(process.env.NODE_ENV === 'development' 
             ? { details: String(error) } 
             : {})
        },
        { status: 500 }
      );
    }
  };
};

/**
 * Middleware para verificar autenticação
 */
export const requireAuth = async () => {
  const { userId } = auth();
  
  if (!userId) {
    throw createUnauthorizedError('Você precisa estar autenticado para acessar este recurso');
  }
  
  return userId;
};

/**
 * Middleware para validar entrada de dados
 */
export const validateRequest = <T>(
  data: unknown,
  validator: (data: unknown) => { success: boolean; data?: T; error?: any }
): T => {
  const result = validator(data);
  
  if (!result.success) {
    throw createValidationError('Dados de entrada inválidos', result.error);
  }
  
  return result.data as T;
};