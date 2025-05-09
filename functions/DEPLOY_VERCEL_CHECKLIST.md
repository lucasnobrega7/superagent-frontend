# Checklist de Deploy para Vercel

Este documento contém um guia passo a passo para realizar o deploy das Cloud Functions no Vercel.

## Requisitos Prévios

- [x] Node.js v18 instalado (use `nvm use 18` para ativar)
- [x] Vercel CLI instalada globalmente (`npm install -g vercel`)
- [x] Conta configurada no Vercel (acesse [vercel.com](https://vercel.com))
- [ ] Variáveis de ambiente configuradas no `.env.production`
- [ ] Build do projeto executado com sucesso (`npm run build`)

## Preparação para Deploy

1. **Verificar configuração do Node.js:**
   ```bash
   node -v  # deve mostrar v18.x.x
   ```

2. **Verificar arquivo vercel.json:**
   - [x] Arquivo vercel.json configurado corretamente
   - [x] Configurações de memória e duração adequadas

3. **Preparar variáveis de ambiente:**
   ```bash
   cp .env.production.example .env.production
   # Edite o arquivo .env.production com os valores corretos
   ```

4. **Compilar o projeto:**
   ```bash
   npm run build
   ```

5. **Executar script de preparação:**
   ```bash
   ./deploy-to-vercel.sh
   ```

## Deploy no Vercel

### Deploy via CLI (linha de comando)

1. **Login no Vercel (se necessário):**
   ```bash
   vercel login
   ```

2. **Deploy de desenvolvimento (para testar):**
   ```bash
   vercel
   ```

3. **Deploy de produção:**
   ```bash
   vercel --prod
   ```

### Deploy via GitHub

1. **Conectar repositório ao Vercel:**
   - Acesse o dashboard do Vercel
   - Clique em "Add New" > "Project"
   - Selecione o repositório do GitHub
   - Configure as opções de build:
     - Framework Preset: Other
     - Build Command: cd functions && npm run build
     - Output Directory: functions/api

2. **Configurar variáveis de ambiente:**
   - Na página do projeto no Vercel, vá para "Settings" > "Environment Variables"
   - Adicione todas as variáveis do arquivo `.env.production`

3. **Deploy:**
   - Clique em "Deploy" no dashboard do Vercel

## Verificação Pós-Deploy

1. **Verificar status da API:**
   ```bash
   curl https://[seu-dominio-vercel].vercel.app/api/functions
   ```

2. **Verificar função de health check:**
   ```bash
   curl https://[seu-dominio-vercel].vercel.app/api/functions/health
   ```

3. **Verificar logs no dashboard do Vercel:**
   - Acesse o dashboard do projeto no Vercel
   - Vá para a aba "Deployments" > seu deploy mais recente > "Logs"

## Resolução de Problemas

### Erro de timeout durante o build
- Aumente o timeout no vercel.json configurando `"buildCommand": "npm run build:extended"`
- Crie um script `build:extended` no package.json com timeout maior

### Erro de versão do Node.js
- Verifique se a versão do Node está configurada para 18.x no vercel.json e package.json
- Use engines.node: "18.x" no package.json

### Erro de função não encontrada
- Verifique se a função está sendo exportada corretamente no index.ts
- Verifique se o caminho da API está correto na solicitação

### Problemas com variáveis de ambiente
- Verifique se todas as variáveis de ambiente estão configuradas no dashboard do Vercel
- As variáveis de ambiente devem ter o mesmo nome usado no código