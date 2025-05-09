/**
 * API de teste para verificar a integração do Supabase
 */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    // Criar cliente Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        status: 'error',
        message: 'Configuração do Supabase não encontrada',
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey
      }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Testar conexão
    const { data, error } = await supabase.from('profiles').select('count');
    
    if (error) {
      return NextResponse.json({
        status: 'error',
        message: 'Erro na conexão com Supabase',
        error: error.message,
        details: {
          code: error.code,
          hint: error.hint
        }
      }, { status: 500 });
    }
    
    // Resposta de sucesso
    return NextResponse.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      connection: 'active',
      data
    });
  } catch (error) {
    console.error('Erro no teste do Supabase:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Erro interno ao testar o Supabase',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}