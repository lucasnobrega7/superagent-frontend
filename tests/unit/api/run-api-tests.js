/**
 * Script para executar todos os testes de API
 */
const { execSync } = require('child_process');
const path = require('path');

// Configurar ambiente de teste
process.env.NODE_ENV = 'test';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock-supabase-url.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-supabase-anon-key';
process.env.NEXT_PUBLIC_SUPERAGENT_API_URL = 'https://mock-superagent-api.com';
process.env.NEXT_PUBLIC_SUPERAGENT_API_KEY = 'mock-superagent-api-key';

console.log('🧪 Iniciando testes da API de Agentes...');

try {
  // Localização do diretório de testes
  const testsDir = path.join(__dirname, 'agents');
  
  // Executar testes com Jest
  execSync(`npx jest ${testsDir} --verbose`, { stdio: 'inherit' });
  
  console.log('✅ Todos os testes foram executados com sucesso!');
} catch (error) {
  console.error('❌ Erro ao executar testes:', error.message);
  process.exit(1);
}