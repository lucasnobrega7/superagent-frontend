/**
 * Testes para os endpoints CRUD de Conhecimento de Agentes
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import * as supabaseModule from '@/app/lib/supabase';
import { Agent, AgentKnowledgeItem } from '@/app/lib/supabase';

// Importações das funções de handlers dos endpoints
import { GET, POST } from '@/app/api/v1/agents/[id]/knowledge/route';
import { DELETE } from '@/app/api/v1/agents/[id]/knowledge/[itemId]/route';

// Mock para superagent-client
jest.mock('@/app/lib/superagent-client', () => ({
  superagentClient: {
    addTextKnowledge: jest.fn().mockResolvedValue({ id: 'superagent-knowledge-id' }),
    addUrlKnowledge: jest.fn().mockResolvedValue({ id: 'superagent-knowledge-id' }),
    deleteKnowledge: jest.fn().mockResolvedValue({}),
  },
}));

// Mock para funções do Supabase
jest.mock('@/app/lib/supabase', () => {
  const originalModule = jest.requireActual('@/app/lib/supabase');
  return {
    ...originalModule,
    getAgent: jest.fn(),
    getAgentKnowledge: jest.fn(),
    addAgentKnowledge: jest.fn(),
    deleteAgentKnowledgeItem: jest.fn(),
  };
});

// Dados de mock para testes
const mockAgent: Agent = {
  id: 'agent-1',
  user_id: 'mock-user-id',
  name: 'Agente de Teste',
  description: 'Descrição do agente de teste',
  is_public: false,
  config: {
    superagentId: 'superagent-id-1'
  },
  created_at: '2023-01-01T00:00:00Z',
};

const mockKnowledgeItems: AgentKnowledgeItem[] = [
  {
    id: 'knowledge-1',
    agent_id: 'agent-1',
    content_type: 'text',
    content: 'Este é um texto de conhecimento',
    created_at: '2023-01-01T00:00:00Z',
  },
  {
    id: 'knowledge-2',
    agent_id: 'agent-1',
    content_type: 'url',
    content: 'https://example.com/document',
    created_at: '2023-01-02T00:00:00Z',
  },
];

const mockNewKnowledgeItem: AgentKnowledgeItem = {
  id: 'new-knowledge-id',
  agent_id: 'agent-1',
  content_type: 'text',
  content: 'Novo item de conhecimento',
  created_at: '2023-01-03T00:00:00Z',
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

describe('API Endpoints CRUD de Conhecimento de Agentes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (auth as jest.Mock).mockReturnValue({ userId: 'mock-user-id' });
    
    // Configuração padrão dos mocks
    (supabaseModule.getAgent as jest.Mock).mockResolvedValue(mockAgent);
    (supabaseModule.getAgentKnowledge as jest.Mock).mockResolvedValue(mockKnowledgeItems);
    (supabaseModule.addAgentKnowledge as jest.Mock).mockResolvedValue(mockNewKnowledgeItem);
    (supabaseModule.deleteAgentKnowledgeItem as jest.Mock).mockResolvedValue(true);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/agents/:id/knowledge', () => {
    it('deve retornar todos os itens de conhecimento do agente para usuários autorizados', async () => {
      const mockRequest = createMockRequest('GET');
      const response = await GET(mockRequest, { params: { id: 'agent-1' } });
      
      expect(supabaseModule.getAgent).toHaveBeenCalledWith('agent-1');
      expect(supabaseModule.getAgentKnowledge).toHaveBeenCalledWith('agent-1');
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveLength(2);
    });

    it('deve permitir acesso a agentes públicos mesmo sem autenticação', async () => {
      (auth as jest.Mock).mockReturnValue({ userId: null });
      (supabaseModule.getAgent as jest.Mock).mockResolvedValue({
        ...mockAgent,
        is_public: true
      });
      
      const mockRequest = createMockRequest('GET');
      const response = await GET(mockRequest, { params: { id: 'agent-1' } });
      
      expect(response.status).toBe(200);
    });

    it('deve retornar erro 404 quando o agente não existe', async () => {
      (supabaseModule.getAgent as jest.Mock).mockResolvedValue(null);
      
      const mockRequest = createMockRequest('GET');
      const response = await GET(mockRequest, { params: { id: 'nonexistent-agent' } });
      
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toHaveProperty('error', 'Agente não encontrado');
    });

    it('deve retornar erro 403 quando usuário não tem permissão para acessar', async () => {
      (auth as jest.Mock).mockReturnValue({ userId: 'different-user-id' });
      
      const mockRequest = createMockRequest('GET');
      const response = await GET(mockRequest, { params: { id: 'agent-1' } });
      
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data).toHaveProperty('error', 'Não autorizado a acessar este agente');
    });

    it('deve retornar erro 500 quando ocorrer um erro no servidor', async () => {
      (supabaseModule.getAgentKnowledge as jest.Mock).mockRejectedValue(new Error('Erro simulado no banco de dados'));
      
      const mockRequest = createMockRequest('GET');
      const response = await GET(mockRequest, { params: { id: 'agent-1' } });
      
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });
  });

  describe('POST /api/v1/agents/:id/knowledge', () => {
    it('deve adicionar um novo item de conhecimento de texto com sucesso', async () => {
      const mockRequest = createMockRequest('POST', {
        content_type: 'text',
        content: 'Novo item de conhecimento'
      });
      
      const response = await POST(mockRequest, { params: { id: 'agent-1' } });
      
      expect(supabaseModule.getAgent).toHaveBeenCalledWith('agent-1');
      expect(supabaseModule.addAgentKnowledge).toHaveBeenCalled();
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toHaveProperty('id', 'new-knowledge-id');
      expect(data).toHaveProperty('content', 'Novo item de conhecimento');
    });

    it('deve adicionar um novo item de conhecimento de URL com sucesso', async () => {
      const mockRequest = createMockRequest('POST', {
        content_type: 'url',
        content: 'https://example.com/document'
      });
      
      const response = await POST(mockRequest, { params: { id: 'agent-1' } });
      
      expect(supabaseModule.addAgentKnowledge).toHaveBeenCalled();
      expect(response.status).toBe(201);
    });

    it('deve retornar erro 401 para usuários não autenticados', async () => {
      (auth as jest.Mock).mockReturnValue({ userId: null });
      
      const mockRequest = createMockRequest('POST', {
        content_type: 'text',
        content: 'Novo item de conhecimento'
      });
      
      const response = await POST(mockRequest, { params: { id: 'agent-1' } });
      
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toHaveProperty('error', 'Não autorizado');
    });

    it('deve retornar erro 404 quando o agente não existe', async () => {
      (supabaseModule.getAgent as jest.Mock).mockResolvedValue(null);
      
      const mockRequest = createMockRequest('POST', {
        content_type: 'text',
        content: 'Novo item de conhecimento'
      });
      
      const response = await POST(mockRequest, { params: { id: 'nonexistent-agent' } });
      
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toHaveProperty('error', 'Agente não encontrado');
    });

    it('deve retornar erro 403 quando usuário não é o proprietário do agente', async () => {
      (auth as jest.Mock).mockReturnValue({ userId: 'different-user-id' });
      
      const mockRequest = createMockRequest('POST', {
        content_type: 'text',
        content: 'Novo item de conhecimento'
      });
      
      const response = await POST(mockRequest, { params: { id: 'agent-1' } });
      
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data).toHaveProperty('error', 'Não autorizado a modificar este agente');
    });

    it('deve retornar erro 400 quando dados obrigatórios estão faltando', async () => {
      const mockRequest = createMockRequest('POST', {
        // Faltando campo content
        content_type: 'text'
      });
      
      const response = await POST(mockRequest, { params: { id: 'agent-1' } });
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    it('deve retornar erro 400 quando o tipo de conteúdo é inválido', async () => {
      const mockRequest = createMockRequest('POST', {
        content_type: 'invalid-type',
        content: 'Novo item de conhecimento'
      });
      
      const response = await POST(mockRequest, { params: { id: 'agent-1' } });
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error', 'Tipo de conteúdo inválido. Deve ser text, url ou file');
    });

    it('deve retornar erro 500 quando ocorrer um erro no servidor', async () => {
      (supabaseModule.addAgentKnowledge as jest.Mock).mockRejectedValue(new Error('Erro simulado no banco de dados'));
      
      const mockRequest = createMockRequest('POST', {
        content_type: 'text',
        content: 'Novo item de conhecimento'
      });
      
      const response = await POST(mockRequest, { params: { id: 'agent-1' } });
      
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });
  });

  describe('DELETE /api/v1/agents/:id/knowledge/:itemId', () => {
    it('deve excluir um item de conhecimento com sucesso', async () => {
      const mockRequest = createMockRequest('DELETE');
      const response = await DELETE(mockRequest, { params: { id: 'agent-1', itemId: 'knowledge-1' } });
      
      expect(supabaseModule.getAgent).toHaveBeenCalledWith('agent-1');
      expect(supabaseModule.deleteAgentKnowledgeItem).toHaveBeenCalledWith('knowledge-1');
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
    });

    it('deve retornar erro 401 para usuários não autenticados', async () => {
      (auth as jest.Mock).mockReturnValue({ userId: null });
      
      const mockRequest = createMockRequest('DELETE');
      const response = await DELETE(mockRequest, { params: { id: 'agent-1', itemId: 'knowledge-1' } });
      
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toHaveProperty('error', 'Não autorizado');
    });

    it('deve retornar erro 400 quando IDs obrigatórios estão faltando', async () => {
      const mockRequest = createMockRequest('DELETE');
      const response = await DELETE(mockRequest, { params: { id: '', itemId: '' } });
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error', 'ID do agente e ID do item são obrigatórios');
    });

    it('deve retornar erro 404 quando o agente não existe', async () => {
      (supabaseModule.getAgent as jest.Mock).mockResolvedValue(null);
      
      const mockRequest = createMockRequest('DELETE');
      const response = await DELETE(mockRequest, { params: { id: 'nonexistent-agent', itemId: 'knowledge-1' } });
      
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toHaveProperty('error', 'Agente não encontrado');
    });

    it('deve retornar erro 403 quando usuário não é o proprietário do agente', async () => {
      (auth as jest.Mock).mockReturnValue({ userId: 'different-user-id' });
      
      const mockRequest = createMockRequest('DELETE');
      const response = await DELETE(mockRequest, { params: { id: 'agent-1', itemId: 'knowledge-1' } });
      
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data).toHaveProperty('error', 'Não autorizado a modificar este agente');
    });

    it('deve retornar erro 500 quando ocorrer um erro no servidor', async () => {
      (supabaseModule.deleteAgentKnowledgeItem as jest.Mock).mockRejectedValue(new Error('Erro simulado no banco de dados'));
      
      const mockRequest = createMockRequest('DELETE');
      const response = await DELETE(mockRequest, { params: { id: 'agent-1', itemId: 'knowledge-1' } });
      
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });
  });
});