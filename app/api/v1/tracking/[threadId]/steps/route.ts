import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { literalAIClient } from '@/lib/literalai-client';

/**
 * API para gerenciamento de steps em threads do LiteralAI
 */

/**
 * Listar steps de uma thread
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { threadId: string } }
) {
  try {
    // Verificar autenticação
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { threadId } = params;

    if (!threadId) {
      return NextResponse.json({ error: 'ID da thread é obrigatório' }, { status: 400 });
    }

    // Obter parâmetros de consulta
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit') as string) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset') as string) : undefined;

    // Listar steps
    try {
      const steps = await literalAIClient.listThreadSteps(threadId, { limit, offset });
      return NextResponse.json(steps);
    } catch (error) {
      console.error('Erro ao listar steps:', error);
      return NextResponse.json({ error: 'Erro ao listar steps' }, { status: 500 });
    }
  } catch (error) {
    console.error('Erro na rota de listagem de steps:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * Criar um novo step em uma thread
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { threadId: string } }
) {
  try {
    // Verificar autenticação
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { threadId } = params;

    if (!threadId) {
      return NextResponse.json({ error: 'ID da thread é obrigatório' }, { status: 400 });
    }

    // Obter dados da requisição
    const data = await req.json();
    const { name, type, metadata = {} } = data;

    if (!name) {
      return NextResponse.json({ error: 'Nome do step é obrigatório' }, { status: 400 });
    }

    if (!type) {
      return NextResponse.json({ error: 'Tipo do step é obrigatório' }, { status: 400 });
    }

    // Adicionar informações do usuário ao metadata
    const enhancedMetadata = {
      ...metadata,
      userId,
      createdAt: new Date().toISOString()
    };

    // Criar step
    try {
      const step = await literalAIClient.createStep({
        threadId,
        name,
        type,
        metadata: enhancedMetadata
      });

      return NextResponse.json({ stepId: step.id });
    } catch (error) {
      console.error('Erro ao criar step:', error);
      return NextResponse.json({ error: 'Erro ao criar step' }, { status: 500 });
    }
  } catch (error) {
    console.error('Erro na rota de criação de step:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}