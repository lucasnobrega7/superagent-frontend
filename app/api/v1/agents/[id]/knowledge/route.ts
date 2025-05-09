import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { getAgent, getAgentKnowledge, addAgentKnowledge, AgentKnowledgeItem } from '@/app/lib/supabase';

/**
 * GET /api/v1/agents/:id/knowledge
 * Obtém o conhecimento de um agente específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const { userId } = auth();
    const agentId = params.id;
    
    // Buscar agente para verificar acesso
    const agent = await getAgent(agentId);
    
    if (!agent) {
      return NextResponse.json(
        { error: 'Agente não encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar se o usuário tem permissão para acessar o agente
    if (!agent.is_public && agent.user_id !== userId) {
      return NextResponse.json(
        { error: 'Não autorizado a acessar este agente' },
        { status: 403 }
      );
    }
    
    // Buscar conhecimento do agente
    const knowledge = await getAgentKnowledge(agentId);
    
    return NextResponse.json(knowledge);
  } catch (error) {
    console.error('Erro ao buscar conhecimento do agente:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar conhecimento do agente' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/agents/:id/knowledge
 * Adiciona um novo item de conhecimento ao agente
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    const agentId = params.id;
    
    // Buscar agente para verificar propriedade
    const agent = await getAgent(agentId);
    
    if (!agent) {
      return NextResponse.json(
        { error: 'Agente não encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar se o usuário é o proprietário do agente
    if (agent.user_id !== userId) {
      return NextResponse.json(
        { error: 'Não autorizado a modificar este agente' },
        { status: 403 }
      );
    }
    
    // Obter dados do corpo da requisição
    const data = await request.json();
    
    // Validar dados
    if (!data.content_type || !data.content) {
      return NextResponse.json(
        { error: 'Tipo de conteúdo e conteúdo são obrigatórios' },
        { status: 400 }
      );
    }
    
    // Validar tipo de conteúdo
    if (!['text', 'url', 'file'].includes(data.content_type)) {
      return NextResponse.json(
        { error: 'Tipo de conteúdo inválido. Deve ser text, url ou file' },
        { status: 400 }
      );
    }
    
    // Adicionar conhecimento
    const knowledgeItem: Partial<AgentKnowledgeItem> = {
      agent_id: agentId,
      content_type: data.content_type,
      content: data.content,
      file_name: data.file_name,
      metadata: data.metadata || {}
    };
    
    const addedItem = await addAgentKnowledge(knowledgeItem as AgentKnowledgeItem);
    
    // Integração com Superagent
    try {
      const { superagentClient } = await import('@/app/lib/superagent-client');
      
      // Verificar se o agente tem ID do Superagent
      const superagentId = agent.config?.superagentId;
      
      if (superagentId) {
        // Adicionar conhecimento ao Superagent
        if (data.content_type === 'text') {
          await superagentClient.addTextKnowledge(superagentId, data.content, {
            supabaseId: addedItem.id,
            addedAt: new Date().toISOString(),
            addedBy: userId
          });
        } else if (data.content_type === 'url') {
          await superagentClient.addUrlKnowledge(superagentId, data.content, {
            supabaseId: addedItem.id,
            addedAt: new Date().toISOString(),
            addedBy: userId
          });
        }
      } else {
        console.warn('Agente sem ID do Superagent, não foi possível adicionar conhecimento');
      }
    } catch (superagentError) {
      console.error('Erro ao sincronizar conhecimento com Superagent:', superagentError);
      // Continue mesmo se falhar a sincronização
    }
    
    return NextResponse.json(addedItem, { status: 201 });
  } catch (error) {
    console.error('Erro ao adicionar conhecimento:', error);
    return NextResponse.json(
      { error: 'Erro ao adicionar conhecimento' },
      { status: 500 }
    );
  }
}