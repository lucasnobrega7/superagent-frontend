import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { v4 as uuidv4 } from 'uuid';
import { literalAIClient } from '@/lib/literalai-fetch';
import { superagentClient } from '@/lib/superagent-client';

// Define um tipo para parâmetros da URL
type RouteParams = {
  params: {
    id: string;
  };
};

/**
 * Endpoint para enviar mensagens para um agente
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    // Verificar autenticação
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Obter ID do agente da URL
    const agentId = params.id;
    if (!agentId) {
      return NextResponse.json(
        { error: 'ID do agente é obrigatório' },
        { status: 400 }
      );
    }

    // Obter mensagem e ID da conversa do corpo da requisição
    const { message, conversationId } = await req.json();
    if (!message) {
      return NextResponse.json(
        { error: 'Mensagem é obrigatória' },
        { status: 400 }
      );
    }

    // Gerar um novo ID de conversa se não fornecido
    const chatId = conversationId || uuidv4();
    
    // Criar ou continuar thread no LiteralAI para rastreamento
    let threadId: string | null = null;
    if (!conversationId) {
      // Nova conversa, criar thread
      const thread = await literalAIClient.createThread({
        name: `Conversa com Agente ${agentId}`,
        metadata: {
          agentId,
          conversationId: chatId,
          userId,
          startedAt: new Date().toISOString()
        }
      });
      
      if (thread) {
        threadId = thread.id;
        console.log(`Nova thread LiteralAI criada: ${threadId}`);
      }
    } else {
      // Tentar obter thread existente por metadados (implementação simplificada)
      // Em produção, você pode querer armazenar a relação conversa-thread em banco de dados
      threadId = conversationId;
    }
    
    // Rastrear mensagem do usuário
    if (threadId) {
      await literalAIClient.trackUserMessage({
        threadId,
        content: message,
        metadata: {
          userId,
          timestamp: new Date().toISOString()
        }
      });
    }

    try {
      // Invocar o agente via Superagent
      // Simulação de resposta para desenvolvimento
      // Em produção, descomentar o código abaixo e usar o cliente Superagent real
      
      /* 
      const response = await superagentClient.invokeAgent(agentId, { text: message }, { 
        conversationId: chatId 
      });
      */
      
      // Resposta simulada para desenvolvimento
      const response = {
        output: {
          text: `Esta é uma resposta simulada para a mensagem: "${message}"`
        },
        thinking: "Processando a consulta do usuário...\nAnalisando contexto...\nFormulando resposta adequada.",
        sources: [
          {
            title: "Documentação LiteralAI",
            url: "https://docs.literal.ai",
            text: "Trecho de documentação relevante para a resposta."
          }
        ],
        metadata: {
          processingTime: "0.8s",
          modelUsed: "gpt-4"
        }
      };
      
      // Extrair dados da resposta
      const agentResponse = {
        conversationId: chatId,
        message: response.output?.text || response.output || 'Não foi possível obter uma resposta',
        thinking: response.thinking || null,
        sources: response.sources || [],
        metadata: response.metadata || {}
      };
      
      // Rastrear resposta do assistente
      if (threadId) {
        await literalAIClient.trackAssistantMessage({
          threadId,
          content: agentResponse.message,
          metadata: {
            thinking: agentResponse.thinking,
            sources: agentResponse.sources,
            timestamp: new Date().toISOString()
          }
        });
      }
      
      return NextResponse.json(agentResponse);
    } catch (error: any) {
      console.error('Erro ao invocar agente:', error);
      
      // Rastrear erro se thread existir
      if (threadId) {
        await literalAIClient.createStep(threadId, {
          name: 'Erro na Invocação',
          type: 'error',
          metadata: {
            error: error.message || 'Erro desconhecido',
            timestamp: new Date().toISOString()
          }
        });
      }
      
      return NextResponse.json(
        { 
          conversationId: chatId,
          error: error.message || 'Erro ao processar mensagem',
          message: 'Ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.'
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Erro na rota de chat:', error);
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}