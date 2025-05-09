/**
 * Build extensions para Vercel
 * 
 * Este script facilita a preparação da build para deploy no Vercel,
 * automatizando a criação e configuração dos adapters necessários.
 */
const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');

// Configurações
const CONFIG = {
  rootDir: path.resolve(__dirname, '..'),
  libDir: path.resolve(__dirname, '../lib'),
  vercelDir: path.resolve(__dirname, '../api'),
  functionTypes: {
    httpsTrigger: 'onRequest', // Funções HTTP
    callableTrigger: 'onCall'  // Funções chamáveis
  }
};

/**
 * Principal função de execução
 */
async function main() {
  console.log('🔍 Analisando funções compiladas...');
  
  try {
    // Verificar se o diretório lib existe
    if (!fs.existsSync(CONFIG.libDir)) {
      console.error('❌ Diretório lib não encontrado. Execute npm run build primeiro.');
      process.exit(1);
    }
    
    // Criar diretório api para o Vercel se não existir
    if (!fs.existsSync(CONFIG.vercelDir)) {
      fs.mkdirSync(CONFIG.vercelDir, { recursive: true });
      console.log('📁 Diretório api criado');
    }
    
    // Encontrar todas as funções HTTP exportadas
    const httpFunctions = findHttpFunctions();
    console.log(`🔍 Encontradas ${httpFunctions.length} funções HTTP`);
    
    // Criar adapters para o Vercel
    createVercelAdapters(httpFunctions);
    
    console.log('✅ Build extensions concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante a execução:', error);
    process.exit(1);
  }
}

/**
 * Encontra funções HTTP nos arquivos compilados
 */
function findHttpFunctions() {
  const httpFunctions = [];
  
  // Executar grep para encontrar funções HTTP
  try {
    const grepCommand = `grep -l "functions.https.onRequest" ${CONFIG.libDir}/*.js`;
    const grepResult = childProcess.execSync(grepCommand, { encoding: 'utf8' });
    
    const files = grepResult.trim().split('\n').filter(Boolean);
    
    files.forEach(filePath => {
      // Extrair o nome base do arquivo
      const baseName = path.basename(filePath, '.js');
      
      // Ler o conteúdo do arquivo
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Regex para encontrar exportações de funções HTTP
      const regex = /exports\.(\w+)\s*=\s*functions\.https\.onRequest/g;
      let match;
      
      while (match = regex.exec(content)) {
        const functionName = match[1];
        httpFunctions.push({
          name: functionName,
          file: baseName,
          type: 'http'
        });
      }
    });
  } catch (error) {
    console.log('Nenhuma função HTTP encontrada ou erro ao buscar:', error.message);
  }
  
  return httpFunctions;
}

/**
 * Cria adapters para o Vercel a partir das funções encontradas
 */
function createVercelAdapters(functions) {
  console.log('📝 Criando adapters para o Vercel...');
  
  // Criar index.js principal
  const indexPath = path.join(CONFIG.vercelDir, 'index.js');
  fs.writeFileSync(indexPath, createMainAdapter());
  console.log(`✅ Criado adapter principal: ${indexPath}`);
  
  // Criar adapters individuais para cada função
  functions.forEach(func => {
    const functionDir = path.join(CONFIG.vercelDir, func.name);
    if (!fs.existsSync(functionDir)) {
      fs.mkdirSync(functionDir, { recursive: true });
    }
    
    const adapterPath = path.join(functionDir, 'index.js');
    fs.writeFileSync(adapterPath, createFunctionAdapter(func));
    console.log(`✅ Criado adapter para ${func.name}: ${adapterPath}`);
  });
}

/**
 * Cria o conteúdo do adapter principal
 */
function createMainAdapter() {
  return `// Vercel adapter principal para Firebase Functions
const { initializeApp } = require('firebase-admin/app');
const functions = require('../lib/index.js');

// Inicializar Firebase se necessário
try {
  initializeApp();
} catch (e) {
  console.log('Firebase já inicializado ou erro:', e.message);
}

// Handler principal
module.exports = (req, res) => {
  const path = req.url.split('/').filter(Boolean);
  
  if (path.length === 0) {
    return res.status(200).json({
      status: 'ok',
      message: 'API de Firebase Functions no Vercel',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      functions: Object.keys(functions)
        .filter(key => 
          typeof functions[key] === 'object' && 
          typeof functions[key].run === 'function'
        )
        .map(name => ({
          name,
          url: \`/api/\${name}\`
        }))
    });
  }
  
  const functionName = path[0];
  const fn = functions[functionName];
  
  if (!fn || typeof fn.run !== 'function') {
    return res.status(404).json({
      error: 'Function not found',
      message: \`Função "\${functionName}" não encontrada\`,
      available: Object.keys(functions)
        .filter(key => 
          typeof functions[key] === 'object' && 
          typeof functions[key].run === 'function'
        )
    });
  }
  
  try {
    return fn.run(req, res);
  } catch (error) {
    console.error(\`Erro ao executar função \${functionName}:\`, error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Ocorreu um erro ao processar a requisição'
    });
  }
};
`;
}

/**
 * Cria o conteúdo do adapter para uma função específica
 */
function createFunctionAdapter(func) {
  return `// Vercel adapter para a função ${func.name}
const { ${func.name} } = require('../../lib/index.js');

module.exports = (req, res) => {
  try {
    return ${func.name}.run(req, res);
  } catch (error) {
    console.error('Erro na função ${func.name}:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Ocorreu um erro ao processar a requisição'
    });
  }
};
`;
}

// Executa a função principal
main().catch(error => {
  console.error('❌ Erro não tratado:', error);
  process.exit(1);
});