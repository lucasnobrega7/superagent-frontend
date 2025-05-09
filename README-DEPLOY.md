# Instruções de Deploy no Vercel

Este documento contém as instruções para fazer o deploy do frontend no Vercel, com integração ao Firebase Functions.

## Requisitos

- Conta no Vercel
- Conta no Firebase (projeto já configurado)
- Node.js 16+ instalado localmente

## Arquitetura da Integração Firebase

Para resolver problemas de compatibilidade entre o Firebase SDK e o Next.js, implementamos um cliente HTTP alternativo:

- **Cliente HTTP** (`app/lib/api-functions-client.ts`): Usa axios para fazer chamadas HTTP diretas para as Firebase Functions, evitando problemas com o Firebase SDK durante o build.
- **Reescrita de URL** (`vercel.json`): Configura redirecionamentos para APIs Firebase
- **Testes**: Componentes de teste em `/api-test` e `/firebase-test` para verificar a integração

## Passos para Deploy

### 1. Preparação do Ambiente

Certifique-se de que todas as variáveis de ambiente estão configuradas em `.env.production`:

```
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAymaXwMJQdKyUl9HVxW7VgUYS_RSA3qgs
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=sabrinaai-2a39e.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=sabrinaai-2a39e
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=sabrinaai-2a39e.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=17644518588
NEXT_PUBLIC_FIREBASE_APP_ID=1:17644518588:web:2749152df20c54b957a4b9
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-7NCK9MG4H7
NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL=https://us-central1-sabrinaai-2a39e.cloudfunctions.net

# Clerk (auth)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_cmVsaWV2ZWQtYmx1ZWpheS00NS5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_SECRET_KEY=your_clerk_secret_key
```

### 2. Deploy via CLI

Se você estiver utilizando o Vercel CLI, execute:

```bash
# Instale o Vercel CLI (se ainda não tiver)
npm install -g vercel

# Login no Vercel
vercel login

# Deploy para produção
vercel --prod
```

### 3. Deploy via GitHub

Para deployar via GitHub:

1. Conecte seu repositório ao Vercel:
   - Acesse o dashboard do Vercel
   - Clique em "Add New" > "Project"
   - Selecione o repositório
   - Selecione o diretório raiz como "frontend"

2. Configure as variáveis de ambiente:
   - Copie todas as variáveis de `.env.production` para as configurações do projeto no Vercel
   - Garanta que todas as variáveis sensíveis (como tokens de API) estejam protegidas

3. Deploy:
   - Clique em "Deploy"
   - O Vercel irá automaticamente detectar o framework Next.js

### 4. Verificação Pós-Deploy

Após o deploy, verifique se a integração com o Firebase está funcionando:

1. Acesse a URL da sua aplicação no Vercel
2. Navegue até `/firebase-test`
3. Teste as diferentes funcionalidades disponíveis

### 5. Resolução de Problemas

Se encontrar problemas na integração com o Firebase Functions:

1. Verifique se as Firebase Functions estão corretamente implantadas
2. Confirme que as variáveis de ambiente estão definidas
3. Verifique se os CORS estão configurados corretamente
4. Consulte os logs no console do Firebase para identificar erros

## Comandos Úteis

```bash
# Verificar o estado atual do deploy
vercel list

# Visualizar variáveis de ambiente
vercel env list

# Adicionar nova variável de ambiente
vercel env add

# Reimplantar após mudanças
vercel --prod
```

## Notas sobre a Integração Firebase-Vercel

- As funções do Firebase são acessadas através do cliente HTTP alternativo `ApiFunctionsClient`
- Este cliente usa o URL das Firebase Functions configurado em `NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL`
- Os redirecionamentos em `vercel.json` permitem chamadas via `/api/firebase/:path*`
- Para desenvolvimento local, você pode usar o Firebase Emulator

## Usando o Cliente Firebase Alternativo

Para chamar funções Firebase do frontend:

```javascript
import ApiFunctionsClient from '@/app/lib/api-functions-client';

// Exemplo de uso
async function testFirebaseFunction() {
  try {
    // Chamar helloWorld function
    const result = await ApiFunctionsClient.helloWorld();
    console.log(result);
    
    // Listar agentes
    const agents = await ApiFunctionsClient.listAgents();
    console.log(agents);
  } catch (error) {
    console.error('Error calling Firebase function:', error);
  }
}
```

## Script de Deploy Automatizado

Utilize o script `deploy-to-vercel.sh` para um processo de deploy automatizado:

```bash
bash deploy-to-vercel.sh
```

Este script:
- Verifica a instalação do Vercel CLI
- Faz login usando o token configurado
- Executa o deploy para produção
- Faz logout por segurança

Para mais informações sobre configuração e personalização do deploy, consulte a [documentação do Vercel](https://vercel.com/docs) e a [documentação do Firebase](https://firebase.google.com/docs).