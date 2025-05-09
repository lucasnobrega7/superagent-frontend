# Guia de Deployment

Este documento descreve os processos para realizar deployments do projeto Superagent utilizando a Vercel.

## Pré-requisitos

- Acesso à conta da Vercel
- Permissões de deploy no projeto
- CLI da Vercel instalada: `npm i -g vercel`

## Ambientes de Deployment

O projeto possui três ambientes:

| Ambiente | Branch | Finalidade | URL |
|---|---|---|---|
| **Desenvolvimento** | Qualquer branch | Testes durante desenvolvimento | `[branch]--agentesdeconversao.vercel.app` |
| **Staging** | `staging` | Testes de pré-lançamento | `staging.agentesdeconversao.com.br` |
| **Produção** | `main` | Ambiente para usuários finais | `agentesdeconversao.com.br` |

## Deployments Automáticos

### Via GitHub

Os deployments são disparados automaticamente:

1. Push para qualquer branch = Preview deployment
2. Push para `staging` = Deployment de staging
3. Push para `main` = Deployment de produção

### Via GitHub Actions

1. O arquivo `.github/workflows/turbo-ci.yml` controla o processo de CI/CD
2. Passos automatizados:
   - Build usando Turbo
   - Testes e linting
   - Deploy para Vercel

## Deployments Manuais

### Via CLI

```bash
# Login na Vercel (primeira vez)
vercel login

# Deploy para preview
vercel

# Deploy para produção
vercel --prod
```

### Via Dashboard da Vercel

1. Acesse [Vercel Dashboard](https://vercel.com)
2. Selecione o projeto "agentes-de-conversao"
3. Na aba "Deployments", selecione o deployment desejado
4. Clique em "..." e depois "Promote to Production"

## Promoção e Rollback

### Promover um Deployment de Preview para Produção

```bash
# Listar deployments
vercel ls agentes-de-conversao

# Promover um deployment específico para produção
vercel promote [deployment-url]
```

### Rollback para Versão Anterior

```bash
# Listar deployments
vercel ls agentes-de-conversao

# Rollback para deployment específico
vercel alias [projeto] [deployment-url]
```

## Variáveis de Ambiente

As variáveis de ambiente são gerenciadas via Dashboard da Vercel:

1. Acesse as configurações do projeto
2. Navegue até a aba "Environment Variables"
3. Cada ambiente pode ter valores diferentes

Principais variáveis:

- `NEXT_PUBLIC_API_URL`: URL da API
- `NEXT_PUBLIC_FIREBASE_CONFIG`: Configuração do Firebase
- `CLERK_SECRET_KEY`: Chave da API Clerk
- `SUPABASE_URL` / `SUPABASE_KEY`: Credenciais do Supabase

## Monitoramento de Deployment

Após um deployment:

1. Verifique o status na dashboard da Vercel
2. Monitore os logs via `vercel logs`
3. Verifique alertas no Sentry para novos erros
4. Execute testes de smoke utilizando endpoints críticos

## Configurações Específicas da Vercel

O arquivo `vercel.json` contém configurações importantes:

```json
{
  "buildCommand": "npm run turbo:build",
  "regions": ["brs1", "iad1"],
  "cleanUrls": true,
  "headers": [
    // headers de segurança
  ]
}
```

## Lista de Verificação Pós-Deployment

- [ ] Verificar se a aplicação carrega corretamente
- [ ] Testar login/autenticação
- [ ] Verificar funcionalidades críticas
- [ ] Confirmar headers de segurança
- [ ] Verificar se integrações externas estão funcionando
- [ ] Monitorar métricas de performance no Vercel Analytics

## Troubleshooting

### Falha no Build

1. Verifique logs do build na Vercel
2. Execute o build localmente com `npm run turbo:build`
3. Verifique se todas as dependências estão instaladas

### Problemas com Funções Serverless

1. Verifique limites de tempo de execução (10s para API geral, 60s para funções)
2. Revise limites de memória (1024MB)
3. Verifique se a região está correta para minimizar latência

### Processo de Emergência

Em caso de problemas críticos em produção, siga o [Plano de Resposta a Incidentes](./INCIDENT_RESPONSE_PLAN.md).