import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { getAgent, updateAgent, deleteAgent } from '@/app/lib/supabase';

/**
 * GET /api/v1/agents/:id
 * Obtém os detalhes de um agente específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const { userId } = auth();
    const agentId = params.id;
    
    if (!agentId) {
      return NextResponse.json(
        { error: 'ID do agente não fornecido' },
        { status: 400 }
      );
    }
    
    // Buscar agente
    const agent = await getAgent(agentId);
    
    // Verificar se o agente existe
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
    
    return NextResponse.json(agent);
  } catch (error) {
    console.error('Erro ao buscar agente:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar agente' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/v1/agents/:id
 * Atualiza um agente existente
 */
export async function PUT(
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
    
    // Obter dados do corpo da requisição
    const data = await request.json();
    
    // Validar dados
    if (!data.name || !data.description) {
      return NextResponse.json(
        { error: 'Nome e descrição são obrigatórios' },
        { status: 400 }
      );
    }
    
    // Buscar agente para verificar propriedade
    const existingAgent = await getAgent(agentId);
    
    if (!existingAgent) {
      return NextResponse.json(
        { error: 'Agente não encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar se o usuário é o proprietário do agente
    if (existingAgent.user_id !== userId) {
      return NextResponse.json(
        { error: 'Não autorizado a modificar este agente' },
        { status: 403 }
      );
    }
    
    // Atualizar agente
    const updates = {
      name: data.name,
      description: data.description,
      is_public: data.is_public !== undefined ? data.is_public : existingAgent.is_public,
      config: data.config || existingAgent.config
    };
    
    const updatedAgent = await updateAgent(agentId, updates);
    
    // Integração com Superagent
    try {
      const { superagentClient } = await import('@/app/lib/superagent-client');
      
      // Verificar se o agente tem ID do Superagent
      const superagentId = existingAgent.config?.superagentId;
      
      if (superagentId) {
        // Atualizar agente no Superagent
        await superagentClient.updateAgent(superagentId, {
          name: updatedAgent.name,
          description: updatedAgent.description,
          llm: updatedAgent.config?.llm || 'gpt-4',
          tools: updatedAgent.config?.tools || [],
          metadata: { 
            supabaseId: updatedAgent.id,
            isPublic: updatedAgent.is_public,
            updatedAt: new Date().toISOString()
          }
        });
      } else {
        console.warn('Agente sem ID do Superagent, criando novo...');
        
        // Criar novo agente no Superagent se não existir
        const superagentResponse = await superagentClient.createAgent({
          name: updatedAgent.name,
          description: updatedAgent.description,
          llm: updatedAgent.config?.llm || 'gpt-4',
          tools: updatedAgent.config?.tools || [],
          metadata: { 
            supabaseId: updatedAgent.id,
            isPublic: updatedAgent.is_public,
            createdBy: userId 
          }
        });
        
        // Atualizar o agente com o ID do Superagent
        if (superagentResponse && superagentResponse.id) {
          await updateAgent(agentId, {
            config: {
              ...updatedAgent.config,
              superagentId: superagentResponse.id
            }
          });
        }
      }
    } catch (superagentError) {
      console.error('Erro ao sincronizar com Superagent:', superagentError);
      // Continue mesmo se falhar a sincronização
    }
    
    return NextResponse.json(updatedAgent);
  } catch (error) {
    console.error('Erro ao atualizar agente:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar agente' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/agents/:id
 * Exclui um agente
 */
export async function DELETE(
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
    const existingAgent = await getAgent(agentId);
    
    if (!existingAgent) {
      return NextResponse.json(
        { error: 'Agente não encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar se o usuário é o proprietário do agente
    if (existingAgent.user_id !== userId) {
      return NextResponse.json(
        { error: 'Não autorizado a excluir este agente' },
        { status: 403 }
      );
    }
    
    // Excluir agente
    await deleteAgent(agentId);
    
    // Integração com Superagent
    try {
      const { superagentClient } = await import('@/app/lib/superagent-client');
      
      // Verificar se o agente tem ID do Superagent
      const superagentId = existingAgent.config?.superagentId;
      
      if (superagentId) {
        // Excluir agente no Superagent
        await superagentClient.deleteAgent(superagentId);
      } else {
        console.warn('Agente sem ID do Superagent, nada para excluir no Superagent');
      }
    } catch (superagentError) {
      console.error('Erro ao sincronizar exclusão com Superagent:', superagentError);
      // Continue mesmo se falhar a sincronização
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir agente:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir agente' },
      { status: 500 }
    );
  }
}