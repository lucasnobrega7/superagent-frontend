#!/bin/bash
# Script otimizado para deploy de Firebase Functions no Vercel
# Versão 2.0.0

set -e  # Fail on error

echo "🚀 Iniciando preparação de Functions para Vercel"

# Verificar dependências
command -v jq >/dev/null 2>&1 || { 
  echo "❌ jq não encontrado. Instalando..."
  brew install jq || npm install -g jq
}

# Determinar o diretório atual
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
FUNCTIONS_DIR="$SCRIPT_DIR"
FRONTEND_DIR="$(dirname "$FUNCTIONS_DIR")"
VERCEL_API_DIR="$FRONTEND_DIR/api/functions"

# Verificação de ambiente
echo "🔍 Verificando ambiente..."
if [ ! -f "$FUNCTIONS_DIR/package.json" ]; then
  echo "❌ Erro: package.json não encontrado em $FUNCTIONS_DIR"
  exit 1
fi

# Build das functions
echo "🔨 Construindo Firebase Functions..."
cd "$FUNCTIONS_DIR" && npm run build

# Criar diretório de API para o Vercel
echo "📁 Preparando estrutura para o Vercel..."
mkdir -p "$VERCEL_API_DIR"

# Extrair nomes de funções HTTP para criar pontos de entrada individuais
echo "🔍 Identificando funções HTTP..."
HTTP_FUNCTIONS=$(cd "$FUNCTIONS_DIR/lib" && grep -l "functions.https.onRequest" *.js | sed 's/\.js$//')

if [ -z "$HTTP_FUNCTIONS" ]; then
  echo "⚠️ Aviso: Nenhuma função HTTP encontrada"
fi

# Copiar arquivos necessários
echo "📋 Copiando arquivos de build..."
cp -R "$FUNCTIONS_DIR/lib"/* "$VERCEL_API_DIR/"

# Criar arquivo index.js principal
echo "📝 Criando entry point principal da API..."
cat > "$VERCEL_API_DIR/index.js" << EOL
// Firebase Functions adapter para Vercel
const { initializeApp } = require('firebase-admin/app');
const functions = require('../functions/lib/index.js');

// Inicializar o app Firebase se necessário
try {
  initializeApp();
} catch (e) {
  console.log('Firebase já inicializado ou erro na inicialização');
}

// Handler principal para todas as funções
module.exports = async (req, res) => {
  const path = req.url.split('/').filter(Boolean);
  
  if (path.length === 0) {
    return res.status(200).json({
      status: 'ok',
      message: 'API funcionando! Use /api/functions/{function-name} para acessar as funções HTTP.',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown'
    });
  }
  
  const functionName = path[0];
  
  // Tentar acessar a função
  const fn = functions[functionName];
  
  if (!fn || typeof fn.run !== 'function') {
    return res.status(404).json({
      error: 'Function not found',
      message: \`A função "\${functionName}" não foi encontrada\`,
      available: Object.keys(functions)
        .filter(key => typeof functions[key] === 'object' && typeof functions[key].run === 'function')
        .map(key => ({
          name: key,
          type: 'http',
          path: \`/api/functions/\${key}\`
        }))
    });
  }
  
  try {
    // Redirecionar para a função HTTP
    return fn.run(req, res);
  } catch (error) {
    console.error(\`Erro ao executar função \${functionName}:\`, error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Ocorreu um erro ao processar a requisição'
    });
  }
};
EOL

# Criar endpoints individuais para cada função HTTP
echo "🔧 Criando endpoints individuais para funções HTTP..."
for func in $HTTP_FUNCTIONS; do
  echo "  - Criando endpoint para $func..."
  func_dir="$VERCEL_API_DIR/$func"
  mkdir -p "$func_dir"
  
  cat > "$func_dir/index.js" << EOL
// Adapter para função Firebase $func
const { $func } = require('../../functions/lib/index.js');

module.exports = (req, res) => {
  try {
    return $func.run(req, res);
  } catch (error) {
    console.error('Erro na função $func:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Ocorreu um erro ao processar a requisição'
    });
  }
};
EOL
done

# Criar package.json otimizado para Vercel
echo "📦 Criando package.json para o Vercel..."
cat > "$VERCEL_API_DIR/package.json" << EOL
{
  "name": "firebase-functions-vercel",
  "version": "1.0.0",
  "private": true,
  "main": "index.js",
  "engines": {
    "node": "18.x"
  },
  "dependencies": {
    "firebase-admin": "^13.0.0",
    "firebase-functions": "^4.0.0"
  }
}
EOL

echo "✅ Preparação para Vercel concluída!"
echo "🔍 Verifique os arquivos em api/functions/ antes de fazer o deploy"
echo "💡 Execute 'cd $FRONTEND_DIR && vercel' para fazer deploy"