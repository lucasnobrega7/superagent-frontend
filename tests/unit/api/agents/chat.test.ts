/**
 * Testes para o endpoint de chat com Agentes
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import * as supabaseModule from '@/app/lib/supabase';
import { Agent, Conversation } from '@/app/lib/supabase';
import { ApiError } from '@/app/lib/error-handler';

// Importações da função de handler do endpoint
import * as chatModule from '@/app/api/v1/agents/[id]/chat/route';

// Função para acessar diretamente a função handler sem withErrorHandling
let originalPost;

// Mock do withErrorHandling para acessar a função handler original
jest.mock('@/app/lib/error-handler', () => {
  const originalModule = jest.requireActual('@/app/lib/error-handler');
  return {
    ...originalModule,
    withErrorHandling: (handler) => {
      // Salvar a referência para a função handler original
      originalPost = handler;
      // Retornar uma função que chama o handler diretamente
      return handler;
    }
  };
});

// Importar o endpoint após o mock para garantir que o withErrorHandling seja substituído
import { POST } from '@/app/api/v1/agents/[id]/chat/route';

// Mock para superagent-client
jest.mock('@/app/lib/superagent-client', () => ({
  superagentClient: {
    sendMessage: jest.fn().mockResolvedValue({
      output: {
        text: 'Resposta do agente de teste'
      },
      thinking: 'Processo de pensamento do agente',
      sources: [{ title: 'Fonte de teste', content: 'Conteúdo da fonte' }],
      metadata: { key: 'value' }
    })
  }
}));

// Mock para funções do Supabase
jest.mock('@/app/lib/supabase', () => {
  const originalModule = jest.requireActual('@/app/lib/supabase');
  return {
    ...originalModule,
    getAgent: jest.fn(),
    getConversation: jest.fn(),
    createConversation: jest.fn(),
    addMessage: jest.fn(),
  };
});

// Dados de mock para testes
const mockAgent: Agent = {
  id: 'agent-1',
  user_id: 'mock-user-id',
  name: 'Agente de Chat',
  description: 'Agente para testes de chat',
  is_public: false,
  config: {
    superagentId: 'superagent-id-1'
  },
  created_at: '2023-01-01T00:00:00Z',
};

const mockPublicAgent: Agent = {
  ...mockAgent,
  is_public: true
};

const mockConversation: Conversation = {
  id: 'conversation-1',
  user_id: 'mock-user-id',
  title: 'Conversa com Agente de Chat',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
};

// Helper para criar requests
const createMockRequest = (method: string, body?: any): NextRequest => {
  const request = {
    method,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: jest.fn().mockResolvedValue(body || {}),
  } as unknown as NextRequest;
  
  return request;
};

describe('API Endpoint Chat com Agentes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (auth as jest.Mock).mockReturnValue({ userId: 'mock-user-id' });
    
    // Configuração padrão dos mocks
    (supabaseModule.getAgent as jest.Mock).mockResolvedValue(mockAgent);
    (supabaseModule.getConversation as jest.Mock).mockResolvedValue(mockConversation);
    (supabaseModule.createConversation as jest.Mock).mockResolvedValue(mockConversation);
    (supabaseModule.addMessage as jest.Mock).mockResolvedValue({ id: 'message-1' });
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve processar uma mensagem para um agente e retornar resposta quando autenticado', async () => {
    const mockRequest = createMockRequest('POST', {
      message: 'Olá, agente de teste!',
      conversationId: 'conversation-1'
    });
    
    const response = await POST(mockRequest, { params: { id: 'agent-1' } });
    
    expect(supabaseModule.getAgent).toHaveBeenCalledWith('agent-1');
    expect(supabaseModule.getConversation).toHaveBeenCalledWith('conversation-1');
    expect(supabaseModule.addMessage).toHaveBeenCalledTimes(2); // Mensagem do usuário e resposta do agente
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('conversationId', 'conversation-1');
    expect(data).toHaveProperty('message', 'Resposta do agente de teste');
    expect(data).toHaveProperty('thinking', 'Processo de pensamento do agente');
    expect(data).toHaveProperty('sources');
    expect(data).toHaveProperty('metadata');
  });

  it('deve criar uma nova conversa quando conversationId não é fornecido', async () => {
    const mockRequest = createMockRequest('POST', {
      message: 'Olá, agente de teste!'
      // Sem conversationId
    });
    
    const response = await POST(mockRequest, { params: { id: 'agent-1' } });
    
    expect(supabaseModule.createConversation).toHaveBeenCalled();
    expect(supabaseModule.addMessage).toHaveBeenCalledTimes(2);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('conversationId', 'conversation-1');
  });

  it('deve permitir acesso a agentes públicos para usuários não autenticados', async () => {
    (auth as jest.Mock).mockReturnValue({ userId: null });
    (supabaseModule.getAgent as jest.Mock).mockResolvedValue(mockPublicAgent);
    
    const mockRequest = createMockRequest('POST', {
      message: 'Olá, agente público!'
    });
    
    const response = await POST(mockRequest, { params: { id: 'agent-1' } });
    
    // Não deve salvar mensagens para usuários não autenticados
    expect(supabaseModule.addMessage).not.toHaveBeenCalled();
    // Deve criar uma conversa anônima
    expect(supabaseModule.createConversation).not.toHaveBeenCalled();
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.conversationId).toMatch(/^anonymous_/);
  });

  it('deve retornar erro 404 quando o agente não existe', async () => {
    (supabaseModule.getAgent as jest.Mock).mockResolvedValue(null);
    
    const mockRequest = createMockRequest('POST', {
      message: 'Olá, agente inexistente!'
    });
    
    // Testar diretamente com a função original que lançará o erro
    await expect(originalPost(mockRequest, { params: { id: 'nonexistent-agent' } }))
      .rejects
      .toThrow('Agente com ID nonexistent-agent não encontrado');
  });

  it('deve retornar erro 400 quando a mensagem está faltando', async () => {
    const mockRequest = createMockRequest('POST', {
      // Mensagem faltando
      conversationId: 'conversation-1'
    });
    
    // Testar diretamente com a função original que lançará o erro
    await expect(originalPost(mockRequest, { params: { id: 'agent-1' } }))
      .rejects
      .toThrow('Mensagem é obrigatória');
  });

  it('deve retornar erro 403 quando usuário não tem permissão para acessar o agente', async () => {
    (auth as jest.Mock).mockReturnValue({ userId: 'different-user-id' });
    
    const mockRequest = createMockRequest('POST', {
      message: 'Olá, agente restrito!'
    });
    
    // Testar diretamente com a função original que lançará o erro
    await expect(originalPost(mockRequest, { params: { id: 'agent-1' } }))
      .rejects
      .toThrow('Não autorizado a acessar este agente');
  });

  it('deve criar nova conversa quando tenta acessar conversa de outro usuário', async () => {
    (supabaseModule.getConversation as jest.Mock).mockResolvedValue({
      ...mockConversation,
      user_id: 'different-user-id'
    });
    
    const mockRequest = createMockRequest('POST', {
      message: 'Olá!',
      conversationId: 'conversation-1'
    });
    
    // No código atual, ele não lança erro, mas cria uma nova conversa
    const response = await POST(mockRequest, { params: { id: 'agent-1' } });
    expect(response.status).toBe(200);
    expect(supabaseModule.createConversation).toHaveBeenCalled();
  });

  it('deve informar quando o agente não tem configuração do Superagent', async () => {
    (supabaseModule.getAgent as jest.Mock).mockResolvedValue({
      ...mockAgent,
      config: {} // Sem superagentId
    });
    
    const mockRequest = createMockRequest('POST', {
      message: 'Olá, agente sem configuração!'
    });
    
    const response = await POST(mockRequest, { params: { id: 'agent-1' } });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('error', 'CONFIG_MISSING');
  });

  it('deve criar nova conversa se a existente não for encontrada', async () => {
    (supabaseModule.getConversation as jest.Mock).mockRejectedValue(new Error('Conversa não encontrada'));
    
    const mockRequest = createMockRequest('POST', {
      message: 'Olá!',
      conversationId: 'conversa-inexistente'
    });
    
    const response = await POST(mockRequest, { params: { id: 'agent-1' } });
    
    expect(supabaseModule.createConversation).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });
});