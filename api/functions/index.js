// Adaptador de API para Vercel
// Este arquivo serve como ponto de entrada para as Serverless Functions no Vercel

const { initializeApp, getApps } = require('firebase-admin/app');

// Verificar se o Firebase já está inicializado
if (!getApps().length) {
  try {
    initializeApp();
    console.log('Firebase inicializado com sucesso');
  } catch (error) {
    console.error('Erro ao inicializar Firebase:', error);
  }
}

/**
 * Handler principal para requisições de API
 * Esta função roteará as requisições para os endpoints corretos
 */
module.exports = async (req, res) => {
  // Habilitar CORS para todas as origens em ambiente de desenvolvimento
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Endpoint de saúde/diagnóstico
  if (req.url === '/api/functions/health' || req.url === '/api/functions') {
    return res.status(200).json({
      status: 'online',
      message: 'API funcionando corretamente',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0'
    });
  }
  
  try {
    // Extrair o caminho da URL
    const path = req.url.split('/').filter(Boolean);
    
    // Verificar se existe um caminho válido
    if (path.length < 2) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Endpoint não encontrado',
        path: req.url
      });
    }
    
    // O segundo elemento do caminho deve ser o nome da função
    const functionName = path[1];
    
    // Lazy-load do módulo adequado
    try {
      // Tentativa de carregamento dinâmico do módulo correspondente à função
      const functionModule = require(`./${functionName}`);
      
      if (typeof functionModule === 'function') {
        return functionModule(req, res);
      } else {
        throw new Error(`O módulo '${functionName}' não exporta uma função válida`);
      }
    } catch (error) {
      console.error(`Erro ao carregar ou executar função '${functionName}':`, error);
      
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Erro ao processar requisição',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  } catch (error) {
    console.error('Erro geral no handler de API:', error);
    
    return res.status(500).json({
      error: 'Server Error',
      message: 'Ocorreu um erro ao processar a requisição'
    });
  }
};