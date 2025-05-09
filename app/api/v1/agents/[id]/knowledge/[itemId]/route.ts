import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { getAgent, deleteAgentKnowledgeItem } from '@/app/lib/supabase';

/**
 * DELETE /api/v1/agents/:id/knowledge/:itemId
 * Exclui um item de conhecimento de um agente
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
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
    const itemId = params.itemId;
    
    if (!agentId || !itemId) {
      return NextResponse.json(
        { error: 'ID do agente e ID do item são obrigatórios' },
        { status: 400 }
      );
    }
    
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
    
    // Excluir item de conhecimento
    await deleteAgentKnowledgeItem(itemId);
    
    // Integração com Superagent
    try {
      const { superagentClient } = await import('@/app/lib/superagent-client');
      
      // Verificar se o agente tem ID do Superagent
      const superagentId = agent.config?.superagentId;
      
      if (superagentId) {
        // Excluir conhecimento no Superagent (usando identificador Supabase como referência)
        await superagentClient.deleteKnowledge(superagentId, itemId);
      } else {
        console.warn('Agente sem ID do Superagent, nada para excluir no Superagent');
      }
    } catch (superagentError) {
      console.error('Erro ao sincronizar exclusão de conhecimento com Superagent:', superagentError);
      // Continue mesmo se falhar a sincronização
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir item de conhecimento:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir item de conhecimento' },
      { status: 500 }
    );
  }
}