/**
 * API de teste para verificar a implantação na Vercel
 */
import { NextResponse } from 'next/server';

export async function GET() {
  // Verificar se estamos na Vercel
  const isVercel = process.env.VERCEL === '1';
  
  // Obter informações sobre o ambiente
  const environment = process.env.VERCEL_ENV || process.env.NODE_ENV || 'development';
  
  // Coletar informações de configuração para diagnóstico
  const config = {
    // Exibir apenas a existência das variáveis de ambiente, não seus valores
    // para não expor chaves sensíveis
    env: {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasSuperagentApiKey: !!process.env.SUPERAGENT_API_KEY,
      hasClerkPublishableKey: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      nodeEnv: process.env.NODE_ENV
    }
  };

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    deployment: isVercel ? 'vercel' : 'local',
    environment,
    region: process.env.VERCEL_REGION || 'unknown',
    config
  });
}