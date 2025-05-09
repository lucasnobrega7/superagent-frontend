# Superagent Frontend with Firebase and Turbo

Este projeto integra Firebase Cloud Functions com um frontend Next.js para Superagent, utilizando Turborepo para otimização de build.

## Início Rápido

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Configure o Firebase:
   - Renomeie `.env.development` para `.env.local` e adicione suas configurações do Firebase
   - Atualize o arquivo `.firebaserc` com seu ID de projeto Firebase

3. Inicie o ambiente de desenvolvimento com Turbo:
   ```bash
   # Inicia todos os ambientes de desenvolvimento de uma vez
   npm run dev

   # OU inicie componentes separadamente
   npm run dev:frontend
   npm run functions:serve
   ```

## Scripts Otimizados com Turbo

### Comandos Principais

- `npm run dev` - Inicia ambiente de desenvolvimento completo
- `npm run build` - Build completo (frontend + functions)
- `npm run start` - Inicia servidor de produção
- `npm run test` - Executa todos os testes
- `npm run lint` - Executa linting em todo código
- `npm run clean` - Limpa caches e pastas de dependências

### Comandos para Desenvolvimento

- `npm run dev:frontend` - Inicia apenas o servidor Next.js
- `npm run build:frontend` - Build apenas do frontend
- `npm run build:all` - Build completo (frontend + functions)

### Comandos para Firebase Functions

- `npm run functions:build` - Compila funções Firebase
- `npm run functions:serve` - Inicia emulador de funções
- `npm run functions:deploy` - Implanta funções no Firebase
- `npm run functions:logs` - Visualiza logs das funções
- `npm run functions:shell` - Inicia shell interativo

## Firebase Functions

As funções Firebase estão localizadas no diretório `functions/src`:

- `helloWorld` - Uma função callable simples
- `createUserRecord` - Cria um registro de usuário quando um novo usuário se cadastra
- `getApiData` - Uma função HTTP que retorna dados de exemplo

## Implantação

Para implantar no Firebase e Vercel:

1. Construa o aplicativo para produção usando Turbo:
   ```bash
   # Build completo (frontend + functions)
   npm run build:all

   # Implante tudo (frontend na Vercel + functions no Firebase)
   npm run deploy:all
   ```

2. Ou implante componentes separadamente:
   ```bash
   # Implanta apenas as funções Firebase
   npm run functions:deploy

   # Implanta apenas o frontend (via Vercel CLI)
   vercel --prod
   ```

## Uso do Firebase Client

Você pode chamar funções Firebase de seus componentes usando o Firebase Functions Client:

```typescript
import { firebaseFunctionsClient } from '@/lib/api/firebase/functions-client';

// Chamada simples para uma função nomeada
const result = await firebaseFunctionsClient.callFunction('helloWorld');

// Chamada genérica para qualquer função
const data = await firebaseFunctionsClient.callFunction('myFunction', { param1: 'value' });
```

Verifique o componente `components/firebase/FirebaseFunctionTest.tsx` para um exemplo funcional.

## Build Otimizada com Turbo

Este projeto utiliza Turborepo para acelerar builds, testes e linting:

```bash
# Build com cache inteligente
npm run turbo:build

# Lint com cache
npm run turbo:lint
```

Para mais detalhes, consulte o [Guia do Turborepo](./docs/turbo-guide.md) para este projeto.

## Preparação para Produção

Antes de implantar em produção, consulte nosso [Checklist de Produção](./docs/PRODUCTION_CHECKLIST.md) abrangente que cobre:

- Excelência operacional
- Segurança
- Confiabilidade
- Performance
- Otimização de custos

Para situações de emergência, siga nosso [Plano de Resposta a Incidentes](./docs/INCIDENT_RESPONSE_PLAN.md).