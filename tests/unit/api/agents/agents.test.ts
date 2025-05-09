/**
 * Testes para os endpoints CRUD de Agentes
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import * as supabaseModule from '@/app/lib/supabase';
import { Agent } from '@/app/lib/supabase';

// Importações das funções de handlers dos endpoints
import { GET, POST } from '@/app/api/v1/agents/route';
import { GET as GET_AGENT, PUT, DELETE } from '@/app/api/v1/agents/[id]/route';

// Mock para superagent-client
jest.mock('@/app/lib/superagent-client', () => ({
  superagentClient: {
    createAgent: jest.fn().mockResolvedValue({ id: 'mock-superagent-id' }),
    updateAgent: jest.fn().mockResolvedValue({}),
    deleteAgent: jest.fn().mockResolvedValue({}),
  },
}));

// Mock para funções do Supabase
jest.mock('@/app/lib/supabase', () => {
  const originalModule = jest.requireActual('@/app/lib/supabase');
  return {
    ...originalModule,
    getAgents: jest.fn(),
    getPublicAgents: jest.fn(),
    getAgent: jest.fn(),
    createAgent: jest.fn(),
    updateAgent: jest.fn(),
    deleteAgent: jest.fn(),
  };
});

// Dados de mock para testes
const mockAgents: Agent[] = [
  {
    id: 'agent-1',
    user_id: 'mock-user-id',
    name: 'Agente de Teste 1',
    description: 'Descrição do agente de teste 1',
    is_public: false,
    created_at: '2023-01-01T00:00:00Z',
  },
  {
    id: 'agent-2',
    user_id: 'other-user-id',
    name: 'Agente de Teste 2',
    description: 'Descrição do agente de teste 2',
    is_public: true,
    created_at: '2023-01-02T00:00:00Z',
  },
];

const mockNewAgent: Agent = {
  id: 'new-agent-id',
  user_id: 'mock-user-id',
  name: 'Novo Agente',
  description: 'Descrição do novo agente',
  is_public: false,
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

describe('API Endpoints CRUD de Agentes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (auth as jest.Mock).mockReturnValue({ userId: 'mock-user-id' });
    
    // Configuração padrão dos mocks
    (supabaseModule.getAgents as jest.Mock).mockResolvedValue([mockAgents[0]]);
    (supabaseModule.getPublicAgents as jest.Mock).mockResolvedValue([mockAgents[1]]);
    (supabaseModule.getAgent as jest.Mock).mockResolvedValue(mockAgents[0]);
    (supabaseModule.createAgent as jest.Mock).mockResolvedValue(mockNewAgent);
    (supabaseModule.updateAgent as jest.Mock).mockResolvedValue({ ...mockAgents[0], name: 'Agente Atualizado' });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/agents', () => {
    it('deve retornar agentes do usuário e agentes públicos para usuários autenticados', async () => {
      const mockRequest = createMockRequest('GET');
      const response = await GET(mockRequest);
      const data = await response.json();

      expect(supabaseModule.getAgents).toHaveBeenCalledWith('mock-user-id');
      expect(supabaseModule.getPublicAgents).toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(data).toHaveLength(2);
    });

    it('deve retornar apenas agentes públicos para usuários não autenticados', async () => {
      (auth as jest.Mock).mockReturnValue({ userId: null });
      const mockRequest = createMockRequest('GET');
      const response = await GET(mockRequest);
      const data = await response.json();

      expect(supabaseModule.getAgents).not.toHaveBeenCalled();
      expect(supabaseModule.getPublicAgents).toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
    });

    it('deve retornar erro 500 quando ocorrer um erro', async () => {
      (supabaseModule.getPublicAgents as jest.Mock).mockRejectedValue(new Error('Erro simulado no banco de dados'));
      const mockRequest = createMockRequest('GET');
      const response = await GET(mockRequest);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });
  });

  describe('POST /api/v1/agents', () => {
    it('deve criar um novo agente com sucesso quando autenticado', async () => {
      const mockRequest = createMockRequest('POST', {
        name: 'Novo Agente',
        description: 'Descrição do novo agente',
        is_public: false
      });
      
      const response = await POST(mockRequest);
      const data = await response.json();

      expect(supabaseModule.createAgent).toHaveBeenCalled();
      expect(response.status).toBe(201);
      expect(data).toHaveProperty('id', 'new-agent-id');
      expect(data).toHaveProperty('name', 'Novo Agente');
    });

    it('deve retornar erro 401 para usuários não autenticados', async () => {
      (auth as jest.Mock).mockReturnValue({ userId: null });
      
      const mockRequest = createMockRequest('POST', {
        name: 'Novo Agente',
        description: 'Descrição do novo agente'
      });
      
      const response = await POST(mockRequest);
      
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toHaveProperty('error', 'Não autorizado');
    });

    it('deve retornar erro 400 quando dados obrigatórios estão faltando', async () => {
      const mockRequest = createMockRequest('POST', {
        // Faltando campo description
        name: 'Novo Agente'
      });
      
      const response = await POST(mockRequest);
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    it('deve retornar erro 500 quando ocorrer um erro no servidor', async () => {
      (supabaseModule.createAgent as jest.Mock).mockRejectedValue(new Error('Erro simulado no banco de dados'));
      
      const mockRequest = createMockRequest('POST', {
        name: 'Novo Agente',
        description: 'Descrição do novo agente'
      });
      
      const response = await POST(mockRequest);
      
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });
  });

  describe('GET /api/v1/agents/:id', () => {
    it('deve retornar os detalhes de um agente específico', async () => {
      const mockRequest = createMockRequest('GET');
      const response = await GET_AGENT(mockRequest, { params: { id: 'agent-1' } });
      
      expect(supabaseModule.getAgent).toHaveBeenCalledWith('agent-1');
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('id', 'agent-1');
    });

    it('deve retornar erro 404 quando o agente não existe', async () => {
      (supabaseModule.getAgent as jest.Mock).mockResolvedValue(null);
      
      const mockRequest = createMockRequest('GET');
      const response = await GET_AGENT(mockRequest, { params: { id: 'nonexistent-agent' } });
      
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toHaveProperty('error', 'Agente não encontrado');
    });

    it('deve retornar erro 403 quando usuário não tem permissão para acessar', async () => {
      (auth as jest.Mock).mockReturnValue({ userId: 'different-user-id' });
      
      const mockRequest = createMockRequest('GET');
      const response = await GET_AGENT(mockRequest, { params: { id: 'agent-1' } });
      
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data).toHaveProperty('error', 'Não autorizado a acessar este agente');
    });

    it('deve retornar erro 400 quando ID não é fornecido', async () => {
      const mockRequest = createMockRequest('GET');
      const response = await GET_AGENT(mockRequest, { params: { id: '' } });
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error', 'ID do agente não fornecido');
    });
  });

  describe('PUT /api/v1/agents/:id', () => {
    it('deve atualizar um agente com sucesso', async () => {
      const mockRequest = createMockRequest('PUT', {
        name: 'Agente Atualizado',
        description: 'Descrição atualizada',
        is_public: true
      });
      
      const response = await PUT(mockRequest, { params: { id: 'agent-1' } });
      
      expect(supabaseModule.getAgent).toHaveBeenCalledWith('agent-1');
      expect(supabaseModule.updateAgent).toHaveBeenCalled();
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('name', 'Agente Atualizado');
    });

    it('deve retornar erro 401 para usuários não autenticados', async () => {
      (auth as jest.Mock).mockReturnValue({ userId: null });
      
      const mockRequest = createMockRequest('PUT', {
        name: 'Agente Atualizado',
        description: 'Descrição atualizada'
      });
      
      const response = await PUT(mockRequest, { params: { id: 'agent-1' } });
      
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toHaveProperty('error', 'Não autorizado');
    });

    it('deve retornar erro 403 quando usuário não é o proprietário do agente', async () => {
      (auth as jest.Mock).mockReturnValue({ userId: 'different-user-id' });
      
      const mockRequest = createMockRequest('PUT', {
        name: 'Agente Atualizado',
        description: 'Descrição atualizada'
      });
      
      const response = await PUT(mockRequest, { params: { id: 'agent-1' } });
      
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data).toHaveProperty('error', 'Não autorizado a modificar este agente');
    });

    it('deve retornar erro 404 quando o agente não existe', async () => {
      (supabaseModule.getAgent as jest.Mock).mockResolvedValue(null);
      
      const mockRequest = createMockRequest('PUT', {
        name: 'Agente Atualizado',
        description: 'Descrição atualizada'
      });
      
      const response = await PUT(mockRequest, { params: { id: 'nonexistent-agent' } });
      
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toHaveProperty('error', 'Agente não encontrado');
    });

    it('deve retornar erro 400 quando dados obrigatórios estão faltando', async () => {
      const mockRequest = createMockRequest('PUT', {
        // Faltando campo description
        name: 'Agente Atualizado'
      });
      
      const response = await PUT(mockRequest, { params: { id: 'agent-1' } });
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });
  });

  describe('DELETE /api/v1/agents/:id', () => {
    it('deve excluir um agente com sucesso', async () => {
      (supabaseModule.deleteAgent as jest.Mock).mockResolvedValue(true);
      
      const mockRequest = createMockRequest('DELETE');
      const response = await DELETE(mockRequest, { params: { id: 'agent-1' } });
      
      expect(supabaseModule.getAgent).toHaveBeenCalledWith('agent-1');
      expect(supabaseModule.deleteAgent).toHaveBeenCalledWith('agent-1');
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
    });

    it('deve retornar erro 401 para usuários não autenticados', async () => {
      (auth as jest.Mock).mockReturnValue({ userId: null });
      
      const mockRequest = createMockRequest('DELETE');
      const response = await DELETE(mockRequest, { params: { id: 'agent-1' } });
      
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toHaveProperty('error', 'Não autorizado');
    });

    it('deve retornar erro 404 quando o agente não existe', async () => {
      (supabaseModule.getAgent as jest.Mock).mockResolvedValue(null);
      
      const mockRequest = createMockRequest('DELETE');
      const response = await DELETE(mockRequest, { params: { id: 'nonexistent-agent' } });
      
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toHaveProperty('error', 'Agente não encontrado');
    });

    it('deve retornar erro 403 quando usuário não é o proprietário do agente', async () => {
      (auth as jest.Mock).mockReturnValue({ userId: 'different-user-id' });
      
      const mockRequest = createMockRequest('DELETE');
      const response = await DELETE(mockRequest, { params: { id: 'agent-1' } });
      
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data).toHaveProperty('error', 'Não autorizado a excluir este agente');
    });

    it('deve retornar erro 500 quando ocorrer um erro no servidor', async () => {
      (supabaseModule.deleteAgent as jest.Mock).mockRejectedValue(new Error('Erro simulado no banco de dados'));
      
      const mockRequest = createMockRequest('DELETE');
      const response = await DELETE(mockRequest, { params: { id: 'agent-1' } });
      
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });
  });
});