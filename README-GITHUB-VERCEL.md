# Integração GitHub + Vercel

Este guia explica como configurar a integração entre o repositório GitHub e a Vercel para permitir deployments automáticos.

## Pré-requisitos

1. Conta na Vercel (https://vercel.com)
2. Acesso administrativo ao repositório GitHub

## Configuração de Secrets no GitHub

Para que o workflow de CI/CD funcione corretamente, você precisa configurar os seguintes secrets no repositório GitHub:

1. Acesse as configurações do repositório no GitHub
2. Navegue até "Settings" > "Secrets and variables" > "Actions"
3. Adicione os seguintes secrets:

| Nome | Descrição | Como obter |
|---|---|---|
| `VERCEL_TOKEN` | Token de API da Vercel | Vercel Dashboard > Settings > Tokens > Create |
| `VERCEL_ORG_ID` | ID da organização na Vercel | Vercel Dashboard > Settings > General > Your ID |
| `VERCEL_PROJECT_ID` | ID do projeto na Vercel | Vercel Dashboard > Project Settings > General > Project ID |

## Configuração do Projeto na Vercel

1. Acesse a dashboard da Vercel e crie um novo projeto
2. Conecte ao repositório GitHub
3. Configure as variáveis de ambiente necessárias:
   - `NEXT_PUBLIC_API_URL`: URL da API
   - `NEXT_PUBLIC_FIREBASE_CONFIG`: Configuração do Firebase (formato JSON)
   - Outras variáveis específicas do projeto

## Como funciona o CI/CD

O arquivo `.github/workflows/turbo-ci.yml` configura o seguinte fluxo:

1. **Pull Requests**:
   - Executa build, lint e testes
   - Deploy para ambiente de preview

2. **Push para main**:
   - Executa build, lint e testes
   - Deploy para ambiente de produção

## Verificação de Status

Para verificar o status dos deployments:

1. Acesse a aba "Actions" no GitHub para ver o status das execuções do workflow
2. Acesse a dashboard da Vercel para ver o status dos deployments

## Troubleshooting

Se o deployment falhar, verifique:

1. **Logs de CI/CD no GitHub Actions**:
   - Acesse a aba "Actions" no GitHub
   - Clique na execução mais recente do workflow
   - Expanda os detalhes da etapa que falhou

2. **Logs de Build na Vercel**:
   - Acesse a dashboard da Vercel
   - Navegue até o deployment falho
   - Verifique a seção "Build Logs"

3. **Secrets configurados incorretamente**:
   - Verifique se todos os secrets necessários estão configurados
   - Certifique-se de que os valores estão corretos

## Recursos Adicionais

- [Documentação da Vercel sobre GitHub Integration](https://vercel.com/docs/concepts/git/vercel-for-github)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Guia de Deployment](./docs/DEPLOYMENT_GUIDE.md)