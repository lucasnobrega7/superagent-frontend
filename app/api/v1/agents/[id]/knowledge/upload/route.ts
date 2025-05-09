import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { getAgent, addAgentKnowledge, AgentKnowledgeItem, uploadFile } from '@/app/lib/supabase';

/**
 * POST /api/v1/agents/:id/knowledge/upload
 * Faz upload de um arquivo e adiciona como conhecimento ao agente
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
    
    // Processar o formulário multipart
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado' },
        { status: 400 }
      );
    }
    
    // Validar tipo de arquivo
    // Permitir documentos, imagens, áudio e vídeo
    const validFileTypes = [
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain', 'text/csv', 'application/json', 'text/markdown',
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'audio/mpeg', 'audio/wav', 'audio/ogg',
      'video/mp4', 'video/webm'
    ];
    
    if (!validFileTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de arquivo não suportado' },
        { status: 400 }
      );
    }
    
    // Limitar tamanho do arquivo (10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'O arquivo é muito grande. O tamanho máximo é 10MB' },
        { status: 400 }
      );
    }
    
    // Gerar nome de arquivo único
    const fileExtension = file.name.split('.').pop();
    const uniqueFilename = `${agentId}_${Date.now()}.${fileExtension}`;
    const filePath = `agent-knowledge/${uniqueFilename}`;
    
    // Fazer upload do arquivo para o Storage do Supabase
    const fileUrl = await uploadFile('agent-files', filePath, file);
    
    // Adicionar entrada de conhecimento com referência ao arquivo
    const knowledgeItem: Partial<AgentKnowledgeItem> = {
      agent_id: agentId,
      content_type: 'file',
      content: fileUrl,
      file_name: file.name,
      metadata: {
        fileSize: file.size,
        fileType: file.type,
        uploadDate: new Date().toISOString()
      }
    };
    
    const addedItem = await addAgentKnowledge(knowledgeItem as AgentKnowledgeItem);
    
    // Integração com Superagent
    try {
      const { superagentClient } = await import('@/app/lib/superagent-client');
      
      // Verificar se o agente tem ID do Superagent
      const superagentId = agent.config?.superagentId;
      
      if (superagentId) {
        // Adicionar arquivo no Superagent
        // A implementação real dependeria da API do Superagent para upload de arquivos
        // Como o método fileKnowledge espera um File, fazemos um novo upload para o Superagent
        await superagentClient.addFileKnowledge(superagentId, file);
      } else {
        console.warn('Agente sem ID do Superagent, não foi possível adicionar arquivo');
      }
    } catch (superagentError) {
      console.error('Erro ao sincronizar arquivo com Superagent:', superagentError);
      // Continue mesmo se falhar a sincronização
    }
    
    return NextResponse.json(addedItem, { status: 201 });
  } catch (error) {
    console.error('Erro ao fazer upload de arquivo:', error);
    return NextResponse.json(
      { error: 'Erro ao fazer upload de arquivo' },
      { status: 500 }
    );
  }
}