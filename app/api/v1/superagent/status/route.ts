import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { superagentClient } from '@/app/lib/superagent-client';

/**
 * GET /api/v1/superagent/status
 * Verifica o status da conexão com o Superagent
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const { userId } = auth();
    
    // Obter informações de conexão com o Superagent
    const connectionInfo = {
      baseUrl: process.env.NEXT_PUBLIC_SUPERAGENT_API_URL || 'http://localhost:8000/api',
      hasApiKey: !!process.env.NEXT_PUBLIC_SUPERAGENT_API_KEY,
      isAuthenticated: !!userId
    };
    
    // Testar conexão com o Superagent
    try {
      // Tentar fazer uma requisição para o Superagent
      // Esta função ainda não existe no cliente, mas poderia ser adicionada
      // Por enquanto, vamos simular um teste para fins de demonstração
      const result = await testConnection();
      
      return NextResponse.json({
        status: 'success',
        connection: {
          ...connectionInfo,
          online: true,
          version: result.version,
          message: 'Conexão com Superagent estabelecida com sucesso'
        }
      });
    } catch (error) {
      console.error('Erro ao testar conexão com Superagent:', error);
      
      return NextResponse.json({
        status: 'error',
        connection: {
          ...connectionInfo,
          online: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          message: 'Não foi possível conectar ao Superagent API'
        }
      });
    }
  } catch (error) {
    console.error('Erro interno:', error);
    
    return NextResponse.json(
      {
        status: 'error',
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

/**
 * Função para testar a conexão com o Superagent
 * (Simulada para fins de demonstração)
 */
async function testConnection() {
  // Em uma implementação real, esta função faria uma requisição
  // para um endpoint de status ou health check do Superagent
  
  // Simulação de teste:
  const superagentBaseUrl = process.env.NEXT_PUBLIC_SUPERAGENT_API_URL || 'http://localhost:8000/api';
  
  try {
    // Tentar fazer uma requisição simples ao Superagent
    const response = await fetch(`${superagentBaseUrl}/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        ...(process.env.NEXT_PUBLIC_SUPERAGENT_API_KEY ? {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPERAGENT_API_KEY}`
        } : {})
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erro na resposta: ${response.status} ${response.statusText}`);
    }
    
    // Tentar obter a versão da API
    const data = await response.json();
    
    return {
      version: data.version || 'desconhecida',
      status: data.status || 'ok'
    };
  } catch (error) {
    console.error('Erro ao testar conexão:', error);
    throw new Error('Falha ao conectar com o Superagent API');
  }
}