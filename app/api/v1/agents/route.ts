import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { createAgent, getAgents, getPublicAgents, updateAgent } from '@/app/lib/supabase';
import { Agent } from '@/app/lib/supabase';

/**
 * GET /api/v1/agents
 * Lista todos os agentes do usuário atual e agentes públicos
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const { userId } = auth();
    
    if (!userId) {
      // Usuário não autenticado, retornar apenas agentes públicos
      const publicAgents = await getPublicAgents();
      return NextResponse.json(publicAgents);
    }
    
    // Buscar agentes do usuário e agentes públicos
    const [userAgents, publicAgents] = await Promise.all([
      getAgents(userId),
      getPublicAgents()
    ]);
    
    // Filtrar agentes públicos para excluir os que já pertencem ao usuário
    const userAgentIds = new Set(userAgents.map(agent => agent.id));
    const filteredPublicAgents = publicAgents.filter(agent => 
      agent.user_id !== userId && !userAgentIds.has(agent.id)
    );
    
    // Combinar os resultados
    const allAgents = [...userAgents, ...filteredPublicAgents];
    
    return NextResponse.json(allAgents);
  } catch (error) {
    console.error('Erro ao buscar agentes:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar agentes' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/agents
 * Cria um novo agente
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    // Obter dados do corpo da requisição
    const data = await request.json();
    
    // Validar dados
    if (!data.name || !data.description) {
      return NextResponse.json(
        { error: 'Nome e descrição são obrigatórios' },
        { status: 400 }
      );
    }
    
    // Criar agente
    const newAgent: Agent = {
      user_id: userId,
      name: data.name,
      description: data.description,
      avatar_url: data.avatar_url,
      config: data.config || {},
      is_public: data.is_public || false
    };
    
    const createdAgent = await createAgent(newAgent);
    
    // Integração com Superagent
    try {
      const { superagentClient } = await import('@/app/lib/superagent-client');
      
      // Criar agente no Superagent
      const superagentResponse = await superagentClient.createAgent({
        name: createdAgent.name,
        description: createdAgent.description,
        llm: createdAgent.config?.llm || 'gpt-4',
        tools: createdAgent.config?.tools || [],
        metadata: { 
          supabaseId: createdAgent.id,
          isPublic: createdAgent.is_public,
          createdBy: userId 
        }
      });
      
      // Atualizar o agente com o ID do Superagent
      if (superagentResponse && superagentResponse.id) {
        await updateAgent(createdAgent.id!, {
          config: {
            ...createdAgent.config,
            superagentId: superagentResponse.id
          }
        });
      }
    } catch (superagentError) {
      console.error('Erro ao sincronizar com Superagent:', superagentError);
      // Continue mesmo se falhar a sincronização
    }
    
    return NextResponse.json(createdAgent, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar agente:', error);
    return NextResponse.json(
      { error: 'Erro ao criar agente' },
      { status: 500 }
    );
  }
}