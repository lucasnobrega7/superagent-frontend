# Agentes de Conversão - Funções Serverless

Este repositório contém as funções serverless para o projeto "Agentes de Conversão", uma plataforma para criação e gerenciamento de agentes de conversação automatizados para WhatsApp.

## Visão Geral

O projeto "Agentes de Conversão" permite que usuários não-técnicos criem agentes de IA para WhatsApp através de uma interface visual intuitiva. O sistema integra-se com diferentes provedores de API WhatsApp e utiliza um motor de fluxo de trabalho avançado para gerenciar conversas.

### Principais Funcionalidades

- Integração com WhatsApp via Z-API e Evolution API
- Editor visual de fluxos de conversação
- Modo de teste/simulação de conversas
- Dashboard de monitoramento e análise
- APIs RESTful para integração com outros sistemas

## Arquitetura

O projeto é dividido em duas partes principais:

1. **Frontend**: Interface de usuário construída com Next.js
2. **Backend**: Funções serverless (este repositório) implementadas com Firebase Functions/Vercel

## Pré-requisitos

- Node.js v18.x
- npm v9.x ou superior
- Contas nas seguintes plataformas:
  - Firebase (opcional se usar apenas Vercel)
  - Vercel
  - Z-API e/ou Evolution API (para integração com WhatsApp)
  - Sentry (para monitoramento)

## Configuração

1. Clone o repositório
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Configure as variáveis de ambiente:
   ```bash
   cp .env.example .env
   # Edite o arquivo .env com suas credenciais
   ```

## Desenvolvimento

Para iniciar o ambiente de desenvolvimento:

```bash
# Compilar TypeScript em modo watch
npm run build:watch

# Em outro terminal, iniciar o emulador
npm run serve
```

### Scripts Disponíveis

- `npm run lint`: Executa o linter ESLint
- `npm run build`: Compila TypeScript para JavaScript
- `npm run serve`: Inicia emuladores locais
- `npm run deploy`: Deploy para Firebase Functions
- `npm run deploy:vercel`: Deploy para Vercel
- `npm test`: Executa testes

## Deploy

### Vercel

Para realizar deploy na Vercel, utilize o script `deploy-vercel-prod.sh`:

```bash
chmod +x deploy-vercel-prod.sh
./deploy-vercel-prod.sh
```

Veja o arquivo [DEPLOY.md](./DEPLOY.md) para instruções detalhadas e utilize a [DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md) para garantir um processo de deploy completo.

### Firebase (Alternativa)

```bash
npm run deploy
```

## Estrutura do Projeto

```
/
├── .github/            # Configurações do GitHub Actions
├── src/                # Código fonte
│   ├── utils/          # Utilitários
│   ├── whatsapp/       # Integração com WhatsApp
│   │   ├── components/ # Componentes de UI
│   │   ├── z-api.ts    # Cliente Z-API
│   │   ├── evolution-api.ts # Cliente Evolution API
│   │   ├── workflow.ts # Motor de fluxo de trabalho
│   │   └── processor.ts # Processador de mensagens
│   ├── superagent.ts   # Integração com Superagent
│   └── literalai.ts    # Integração com LiteralAI (rastreamento)
├── tests/              # Testes
└── lib/                # Código compilado (gerado)
```

## Integração com WhatsApp

O sistema suporta duas APIs de integração com WhatsApp:

1. **Z-API**: API brasileira com suporte a múltiplas instâncias
2. **Evolution API**: API open-source para instalação própria

A configuração de qual API utilizar é feita por projeto e pode ser alterada nas configurações.

## Motor de Fluxo de Trabalho

O sistema utiliza um motor de fluxo de trabalho proprietário que permite a criação de fluxos de conversação complexos. Os fluxos são compostos por nós de diferentes tipos:

- Mensagem: Envio de textos, imagens ou botões
- Entrada: Coleta de informações do usuário
- Condição: Ramificação baseada em regras
- API: Integração com serviços externos
- Ação: Execução de código personalizado

## Monitoramento

O sistema utiliza Sentry para monitoramento de erros e performance. Todas as funções serverless são instrumentadas para capturar exceções e métricas de performance.

## Licença

Este projeto é propriedade exclusiva e não está disponível para uso ou distribuição sem autorização expressa.