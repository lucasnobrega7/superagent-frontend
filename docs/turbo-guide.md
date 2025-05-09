# Guia de Uso do Turborepo

O projeto Superagent agora está configurado com [Turborepo](https://turbo.build/repo) para melhorar a performance de build e desenvolvimento.

## O que é o Turborepo?

Turborepo é uma ferramenta de build de alta performance que:

- Armazena em cache os resultados de builds/lints/testes anteriores
- Reduz drasticamente o tempo de build em desenvolvimento e CI/CD
- Executa tarefas em paralelo quando possível
- Evita trabalho duplicado

## Como Usar

### Comandos com Turbo

Adicionamos os seguintes comandos com suporte a cache:

```bash
# Build com cache
npm run turbo:build     # Executa next build e armazena em cache

# Lint com cache
npm run turbo:lint      # Executa ESLint com cache

# Testes com cache 
npm run turbo:test      # Executa testes com cache

# Desenvolvimento
npm run turbo:dev       # Roda ambiente de desenvolvimento
```

### Comandos Regulares

Os comandos regulares continuam funcionando normalmente:

```bash
npm run dev             # Ambiente de desenvolvimento
npm run build           # Build padrão (sem cache)
npm run test            # Testes (sem cache)
npm run lint            # Linting (sem cache)
```

## Como Turborepo Melhora o Performance

1. **Cache Inteligente**: Após a primeira build, executar `npm run turbo:build` novamente será muito mais rápido se não houver alterações.

2. **Execução em Paralelo**: Turbo executa tarefas em paralelo quando possível, o que acelera as builds.

3. **CI/CD Otimizado**: Quando integrado ao pipeline CI/CD, builds podem ser até 10x mais rápidas através de cache compartilhado.

## Visualizando o Cache

Para ver quais tarefas estão usando cache, adicione a flag `--summarize`:

```bash
npx turbo build --summarize
```

## Limpando o Cache

Se você precisar limpar o cache para forçar uma nova build:

```bash
# Limpa o cache completo
npm run clean

# Executa uma build ignorando o cache
npx turbo build --force
```

## Configuração

A configuração do Turborepo está em `turbo.json` na raiz do projeto:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalEnv": ["NODE_ENV", "FIREBASE_CONFIG", "NEXT_PUBLIC_*"],
  "tasks": {
    "build": {
      "outputs": [".next/**", "!.next/cache/**"]
    },
    "lint": {},
    "dev": {
      "cache": false,
      "persistent": true
    },
    "start": {
      "dependsOn": ["build"]
    },
    "test": {
      "outputs": ["coverage/**"]
    }
  }
}
```

## Integração com CI/CD

Para integrar com GitHub Actions ou outros sistemas CI/CD, certifique-se de:

1. Usar `turbo:build` nos scripts de build para aproveitar o cache
2. Configurar cache no CI para armazenar a pasta `.turbo` entre builds
3. Considerar usar cache remoto para equipes maiores

## Solução de Problemas

- **Recursão**: Se você encontrar "recursive turbo invocation", certifique-se de que o script não chama `turbo` diretamente.
- **Problemas de Cache**: Use `--force` para ignorar o cache quando necessário.
- **Dependências**: Se as tarefas estão executando na ordem errada, revise as configurações `dependsOn` no turbo.json.

## Mais Informações

Para mais detalhes, consulte a [documentação oficial do Turborepo](https://turbo.build/repo/docs).