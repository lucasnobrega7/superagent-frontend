# Testes de API para Endpoints CRUD de Agentes

Este documento detalha os testes implementados para os endpoints CRUD (Create, Read, Update, Delete) da API de Agentes do projeto.

## Estrutura de Testes

Os testes estão organizados em três arquivos principais:

1. `app/api/v1/agents/__tests__/agents.test.ts` - Testes para operações CRUD básicas de agentes
2. `app/api/v1/agents/__tests__/knowledge.test.ts` - Testes para gerenciamento de conhecimento dos agentes
3. `app/api/v1/agents/__tests__/chat.test.ts` - Testes para funcionalidade de chat com agentes

## Casos de Teste Implementados

### Operações CRUD de Agentes

- **Listagem de Agentes (GET /api/v1/agents)**
  - ✅ Retorna agentes do usuário e agentes públicos para usuários autenticados
  - ✅ Retorna apenas agentes públicos para usuários não autenticados
  - ✅ Retorna erro 500 quando ocorre um erro no servidor

- **Criação de Agentes (POST /api/v1/agents)**
  - ✅ Cria um novo agente com sucesso quando autenticado
  - ✅ Retorna erro 401 para usuários não autenticados
  - ✅ Retorna erro 400 quando dados obrigatórios estão faltando
  - ✅ Retorna erro 500 quando ocorre um erro no servidor

- **Detalhes de Agente (GET /api/v1/agents/:id)**
  - ✅ Retorna os detalhes de um agente específico
  - ✅ Retorna erro 404 quando o agente não existe
  - ✅ Retorna erro 403 quando usuário não tem permissão para acessar
  - ✅ Retorna erro 400 quando ID não é fornecido

- **Atualização de Agente (PUT /api/v1/agents/:id)**
  - ✅ Atualiza um agente com sucesso
  - ✅ Retorna erro 401 para usuários não autenticados
  - ✅ Retorna erro 403 quando usuário não é o proprietário do agente
  - ✅ Retorna erro 404 quando o agente não existe
  - ✅ Retorna erro 400 quando dados obrigatórios estão faltando

- **Exclusão de Agente (DELETE /api/v1/agents/:id)**
  - ✅ Exclui um agente com sucesso
  - ✅ Retorna erro 401 para usuários não autenticados
  - ✅ Retorna erro 404 quando o agente não existe
  - ✅ Retorna erro 403 quando usuário não é o proprietário do agente
  - ✅ Retorna erro 500 quando ocorre um erro no servidor

### Gerenciamento de Conhecimento

- **Listagem de Conhecimento (GET /api/v1/agents/:id/knowledge)**
  - ✅ Retorna todos os itens de conhecimento do agente para usuários autorizados
  - ✅ Permite acesso a agentes públicos mesmo sem autenticação
  - ✅ Retorna erro 404 quando o agente não existe
  - ✅ Retorna erro 403 quando usuário não tem permissão para acessar
  - ✅ Retorna erro 500 quando ocorre um erro no servidor

- **Adição de Conhecimento (POST /api/v1/agents/:id/knowledge)**
  - ✅ Adiciona um novo item de conhecimento de texto com sucesso
  - ✅ Adiciona um novo item de conhecimento de URL com sucesso
  - ✅ Retorna erro 401 para usuários não autenticados
  - ✅ Retorna erro 404 quando o agente não existe
  - ✅ Retorna erro 403 quando usuário não é o proprietário do agente
  - ✅ Retorna erro 400 quando dados obrigatórios estão faltando
  - ✅ Retorna erro 400 quando o tipo de conteúdo é inválido
  - ✅ Retorna erro 500 quando ocorre um erro no servidor

- **Exclusão de Conhecimento (DELETE /api/v1/agents/:id/knowledge/:itemId)**
  - ✅ Exclui um item de conhecimento com sucesso
  - ✅ Retorna erro 401 para usuários não autenticados
  - ✅ Retorna erro 400 quando IDs obrigatórios estão faltando
  - ✅ Retorna erro 404 quando o agente não existe
  - ✅ Retorna erro 403 quando usuário não é o proprietário do agente
  - ✅ Retorna erro 500 quando ocorre um erro no servidor

### Chat com Agentes

- **Envio de Mensagem (POST /api/v1/agents/:id/chat)**
  - ✅ Processa uma mensagem para um agente e retorna resposta quando autenticado
  - ✅ Cria uma nova conversa quando conversationId não é fornecido
  - ✅ Permite acesso a agentes públicos para usuários não autenticados
  - ✅ Retorna erro 404 quando o agente não existe
  - ✅ Retorna erro 400 quando a mensagem está faltando
  - ✅ Retorna erro 403 quando usuário não tem permissão para acessar o agente
  - ✅ Cria nova conversa quando tenta acessar conversa de outro usuário
  - ✅ Informa quando o agente não tem configuração do Superagent
  - ✅ Cria nova conversa se a existente não for encontrada

## Execução dos Testes

Para executar os testes de API:

```bash
npm run test:api
```

Este comando executa o script `run-api-tests.js` que configura o ambiente de teste e executa os testes com Jest.

## Tecnologias Utilizadas

- **Jest**: Framework de testes
- **ts-jest**: Integração do Jest com TypeScript
- **SuperTest (mock customizado)**: Para simular requisições HTTP
- **jest-environment-node**: Ambiente de execução para testes
- **Mocks**: Implementados para simular serviços, autenticação e respostas

## Estrutura dos Mocks

- **@clerk/nextjs**: Mock para simular autenticação
- **@/app/lib/supabase**: Mock para simular operações com banco de dados
- **@/app/lib/superagent-client**: Mock para simular integração com Superagent
- **@/app/lib/error-handler**: Mock para testes com tratamento de erros (especialmente para chat)

## Notas Adicionais

- Os testes cobrem todos os endpoints CRUD de agentes
- Todos os cenários de erro são testados (400, 401, 403, 404, 500)
- As integrações externas são mockadas para garantir testes unitários consistentes
- O tratamento de erros com withErrorHandling é testado usando mocks específicos