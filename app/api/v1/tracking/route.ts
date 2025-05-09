import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { literalAIClient } from '@/lib/literalai-client';

/**
 * API para rastreamento de conversas com LiteralAI
 */

/**
 * Criar uma nova thread de rastreamento
 */
export async function POST(req: NextRequest) {
  try {
    // Verificar autenticação
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Obter dados da requisição
    const data = await req.json();
    const { name, metadata = {} } = data;

    if (!name) {
      return NextResponse.json({ error: 'Nome da thread é obrigatório' }, { status: 400 });
    }

    // Adicionar informações do usuário ao metadata
    const enhancedMetadata = {
      ...metadata,
      userId,
      createdAt: new Date().toISOString()
    };

    // Criar thread
    try {
      const response = await literalAIClient.createThread({
        name,
        metadata: enhancedMetadata
      });

      return NextResponse.json({ threadId: response.id });
    } catch (error) {
      console.error('Erro ao criar thread:', error);
      return NextResponse.json({ error: 'Erro ao criar thread' }, { status: 500 });
    }
  } catch (error) {
    console.error('Erro na rota de criação de thread:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * Listar threads de rastreamento
 */
export async function GET(req: NextRequest) {
  try {
    // Verificar autenticação
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Obter parâmetros de consulta
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit') as string) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset') as string) : undefined;

    // Listar threads
    try {
      const response = await literalAIClient.listThreads({ limit, offset });
      return NextResponse.json(response);
    } catch (error) {
      console.error('Erro ao listar threads:', error);
      return NextResponse.json({ error: 'Erro ao listar threads' }, { status: 500 });
    }
  } catch (error) {
    console.error('Erro na rota de listagem de threads:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}