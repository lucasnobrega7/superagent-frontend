// Endpoint de Health Check
// Permite verificar se a API está funcionando corretamente

/**
 * Handler para verificação de saúde da API
 * Retorna status e informações básicas sobre o ambiente
 */
module.exports = async (req, res) => {
  // Verificar método da requisição
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).json({
      error: 'Method Not Allowed',
      message: `Método ${req.method} não suportado neste endpoint`
    });
  }

  // Coletar informações sobre o ambiente
  const healthInfo = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    region: process.env.VERCEL_REGION || 'unknown',
    version: '1.0.0',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  };

  // Adicionar informações extras em ambiente não-produção
  if (process.env.NODE_ENV !== 'production') {
    healthInfo.details = {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
    };
  }

  // Responder com status 200 OK
  return res.status(200).json(healthInfo);
};