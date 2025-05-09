# Guia de Deploy para o Projeto "Agentes de Conversão"

Este documento fornece instruções detalhadas para o deploy do projeto "Agentes de Conversão" no GitHub e Vercel.

## 1. Pré-requisitos

Antes de iniciar o processo de deploy, certifique-se de ter:

- **Credenciais e Acessos**:
  - Conta GitHub com acesso ao repositório
  - Conta Vercel com plano adequado
  - Token de acesso da Vercel
  - Credenciais para serviços de terceiros (OpenAI, Z-API, Evolution API)

- **Ferramentas Locais**:
  - Node.js versão 18.x
  - Git configurado
  - Vercel CLI (`npm i -g vercel`)

## 2. Configuração de Variáveis de Ambiente

As seguintes variáveis de ambiente são necessárias para o funcionamento correto do projeto:

### Desenvolvimento (.env.local)
```
# API Configuration
SUPERAGENT_API_URL=http://localhost:3000/api
SUPERAGENT_API_KEY=your-key-here

# LiteralAI API
LITERALAI_API_URL=http://localhost:3001/api
LITERALAI_API_KEY=your-key-here

# WhatsApp API Credentials
ZAPI_TOKEN=your-zapi-token
ZAPI_INSTANCE=your-zapi-instance
EVOLUTION_API_URL=your-evolution-api-url
EVOLUTION_API_KEY=your-evolution-api-key

# Firebase Configuration
FIREBASE_CONFIG={"projectId":"your-project","appId":"your-app-id"}

# Monitoring
SENTRY_DSN=your-sentry-dsn
```

### Produção (.env.production)
```
# API Configuration
SUPERAGENT_API_URL=https://api.superagent.sh
SUPERAGENT_API_KEY=${SUPERAGENT_API_KEY}

# LiteralAI API
LITERALAI_API_URL=https://api.literalai.io
LITERALAI_API_KEY=${LITERALAI_API_KEY}

# WhatsApp API Credentials
ZAPI_TOKEN=${ZAPI_TOKEN}
ZAPI_INSTANCE=${ZAPI_INSTANCE}
EVOLUTION_API_URL=${EVOLUTION_API_URL}
EVOLUTION_API_KEY=${EVOLUTION_API_KEY}

# Firebase Configuration
FIREBASE_CONFIG=${FIREBASE_CONFIG}

# Node Environment
NODE_ENV=production

# Monitoring
SENTRY_DSN=${SENTRY_DSN}

# Versão da função
FUNCTION_VERSION=1.0.0
```

As variáveis com ${VARIABLE_NAME} serão substituídas pelos valores configurados no painel da Vercel.

## 3. GitHub Actions para CI/CD

O projeto está configurado com um fluxo de CI/CD usando GitHub Actions. O arquivo de configuração `.github/workflows/ci-cd.yml` define:

1. **Lint e Testes**: Execução de linting e testes automatizados
2. **Build**: Compilação do código TypeScript para JavaScript
3. **Deploy**: Deploy automático para Vercel em branches específicas

Para habilitar o deploy automático, configure os seguintes secrets no GitHub:

- `VERCEL_TOKEN`: Token de acesso da Vercel
- `VERCEL_ORG_ID`: ID da organização na Vercel
- `VERCEL_PROJECT_ID`: ID do projeto na Vercel
- `SUPERAGENT_API_URL`: URL da API Superagent
- `LITERALAI_API_URL`: URL da API LiteralAI

## 4. Deploy Manual para Vercel

Para realizar um deploy manual para a Vercel, utilize o script `deploy-vercel-prod.sh`:

```bash
# Tornar o script executável (se necessário)
chmod +x deploy-vercel-prod.sh

# Executar o script de deploy
./deploy-vercel-prod.sh
```

O script executará as seguintes ações:
1. Verificação do ambiente Node.js
2. Verificação da instalação do Vercel CLI
3. Verificação de alterações não comitadas no Git
4. Verificação do arquivo .env.production
5. Limpeza do diretório de build
6. Instalação de dependências
7. Execução de lint e testes
8. Geração de build otimizado
9. Deploy para a Vercel

## 5. Monitoramento e Rollback

### Monitoramento

O projeto utiliza Sentry para monitoramento de erros em produção. Verifique o painel do Sentry após o deploy para identificar possíveis problemas não capturados durante os testes.

### Rollback

Para reverter para uma versão anterior em caso de problemas:

1. Acesse o dashboard do projeto na Vercel
2. Vá para a aba "Deployments"
3. Localize o deploy anterior estável
4. Clique nos três pontos (ações) > "Promote to Production"

## 6. Verificação Pós-Deploy

Após o deploy, execute as seguintes verificações:

- **Funções da API**: Teste os principais endpoints
- **Monitoramento**: Verifique o Sentry para erros
- **Logs**: Confira os logs na Vercel para possíveis avisos ou erros
- **Performance**: Avalie o tempo de resposta dos endpoints críticos

## 7. Solução de Problemas Comuns

### Falha no Build

**Sintoma**: Erro durante o processo de build  
**Solução**: Verifique erros de sintaxe ou tipagem, dependências incompatíveis e variáveis de ambiente faltantes

### Erro 504 em Funções

**Sintoma**: Timeout (erro 504) em funções serverless  
**Solução**: Otimize o código para executar em menos de 10 segundos ou aumente o limite de duração das funções na configuração da Vercel

### Problemas de CORS

**Sintoma**: Erros de CORS no frontend  
**Solução**: Verifique os headers configurados no `vercel.json` e certifique-se de que as origens corretas estão permitidas

### Função Inicializando Lentamente (Cold Start)

**Sintoma**: Primeira chamada muito lenta  
**Solução**: Otimize imports, utilize lazy loading e considere endpoints de "warmup"

## Contato para Suporte

Para questões relacionadas ao deploy, entre em contato com:

- **Suporte Técnico**: suporte@agentesdeconversao.com.br
- **Repositório**: [GitHub - Agentes de Conversão](https://github.com/usuario/agentes-conversao)