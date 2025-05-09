# Deploy de Firebase Functions no Vercel

Este guia explica como realizar o deploy de Firebase Cloud Functions no Vercel, aproveitando a infraestrutura serverless para obter maior performance, escalabilidade e menor latência.

## Por que usar o Vercel para Firebase Functions?

- **Melhor performance**: Menor latência para usuários finais
- **Integração com NextJS**: Trabalha perfeitamente com o frontend Next.js
- **Deploy simplificado**: CI/CD automático via GitHub
- **Escalabilidade**: Serverless por padrão
- **Monitoramento**: Métricas e logs integrados

## Pré-requisitos

- Node.js v18.x instalado (`nvm use 18`)
- Vercel CLI instalado (`npm i -g vercel`)
- Conta no Vercel ([vercel.com](https://vercel.com))
- Firebase SDK configurado (já incluído no projeto)

## Estrutura do Projeto para Vercel

```
frontend/
  ├── functions/             # Código das Firebase Functions
  │   ├── src/               # Código fonte TypeScript
  │   ├── lib/               # Código compilado (gerado)
  │   ├── api/               # Adaptadores para Vercel (gerado)
  │   ├── tools/             # Utilitários de build para Vercel
  │   ├── vercel.json        # Configuração do Vercel
  │   └── deploy-to-vercel.sh # Script de preparação para deploy
  ├── api/                   # Roteamento para o Vercel
  │   └── functions/         # Link para as funções adaptadas
  └── vercel.json            # Configuração principal do Vercel
```

## Passos para Deploy

### 1. Preparação do Ambiente

Certifique-se de estar usando Node.js v18:

```bash
nvm use 18
```

### 2. Instalar Dependências (se necessário)

```bash
cd frontend/functions
npm install
```

### 3. Criar Arquivo .env.production

Copie o arquivo de exemplo e preencha com os valores corretos:

```bash
cp .env.production.example .env.production
# Edite o arquivo com os valores apropriados
```

### 4. Preparar o Projeto para Deploy

Execute o script de preparação para deploy que criará os adaptadores necessários:

```bash
npm run deploy:vercel:prepare
```

Este comando:
- Compila o código TypeScript
- Cria a estrutura de adaptadores para o Vercel
- Prepara os arquivos de configuração

### 5. Realizar o Deploy

```bash
npm run deploy:vercel
```

Ou diretamente com o CLI do Vercel:

```bash
vercel --prod
```

## Estrutura dos Adaptadores

Para cada função HTTP exportada em `src/index.ts`, o sistema gera um adaptador no diretório `api/functions/[nome-da-função]/index.js` que converte o formato do Firebase Functions para o formato esperado pelo Vercel.

## Scripts Disponíveis

- `npm run build:vercel`: Compila o código e cria os adaptadores
- `npm run deploy:vercel:prepare`: Prepara o projeto para deploy
- `npm run deploy:vercel`: Realiza o deploy para o Vercel

## Solução de Problemas

### Erro: "Functions require a valid path"

Se você receber este erro durante o deploy, verifique se:
- A estrutura de diretórios `api/functions/` foi criada corretamente
- O script de preparação foi executado (`npm run deploy:vercel:prepare`)
- O arquivo `vercel.json` está configurado corretamente

### Erro de versão do Node.js

Certifique-se de estar usando Node.js v18:
```bash
nvm use 18
```

### Erro de variáveis de ambiente

Verifique se as variáveis de ambiente necessárias estão configuradas:
- No arquivo `.env.production` para desenvolvimento local
- No dashboard do Vercel para produção

## Verificação Pós-Deploy

Após o deploy, verifique se as funções estão operando corretamente:

```bash
curl https://seu-projeto.vercel.app/api/functions
```

Isso deve retornar uma lista de funções disponíveis.

## Executando Localmente

Para testar localmente antes do deploy:

```bash
# Compilar o projeto
npm run build:vercel

# Instalar Vercel CLI se necessário
npm i -g vercel

# Executar localmente
vercel dev
```

## Recursos Adicionais

- [Documentação do Vercel Serverless Functions](https://vercel.com/docs/serverless-functions/introduction)
- [Firebase Functions no Vercel](https://firebase.google.com/docs/hosting/cloud-run)
- [Gerenciamento de Variáveis de Ambiente no Vercel](https://vercel.com/docs/environment-variables)