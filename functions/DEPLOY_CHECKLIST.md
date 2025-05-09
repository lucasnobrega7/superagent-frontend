# Checklist de Deploy - Projeto Agentes de Conversão

Use esta checklist para garantir um deploy seguro e bem-sucedido do projeto na Vercel.

## 1. Preparação

- [ ] Versão do Node.js é 18.x
- [ ] Todas as alterações estão comitadas no Git
- [ ] Branch está atualizada com `main`
- [ ] Vercel CLI está instalado (`npm i -g vercel`)
- [ ] Variáveis de ambiente estão configuradas em `.env.production`
- [ ] Secrets necessários estão configurados na Vercel:
  - [ ] `SUPERAGENT_API_KEY`
  - [ ] `LITERALAI_API_KEY`
  - [ ] `ZAPI_TOKEN`
  - [ ] `ZAPI_INSTANCE`
  - [ ] `EVOLUTION_API_URL`
  - [ ] `EVOLUTION_API_KEY`
  - [ ] `FIREBASE_CONFIG`
  - [ ] `SENTRY_DSN`

## 2. Testes Pré-deploy

- [ ] Linting passa sem erros: `npm run lint`
- [ ] Compilação TypeScript funciona: `npm run build`
- [ ] Testes automatizados passam: `npm test`
- [ ] Pacotes de dependências atualizados: `npm outdated`
- [ ] Não há vulnerabilidades críticas: `npm audit`

## 3. Build

- [ ] Build concluído com sucesso: `npm run build:vercel`
- [ ] Diretório `lib` gerado corretamente
- [ ] Arquivos de configuração estão presentes:
  - [ ] `vercel.json`
  - [ ] `package.json`
  - [ ] `tsconfig.json`

## 4. Deploy

- [ ] Script de deploy executado: `./deploy-vercel-prod.sh`
- [ ] Verificar se deploy foi bem-sucedido no painel da Vercel
- [ ] URLs de produção estão funcionando
- [ ] Certificados SSL válidos

## 5. Verificações Pós-deploy

- [ ] Testar endpoint de health check
- [ ] Verificar integração com WhatsApp:
  - [ ] Z-API está respondendo
  - [ ] Evolution API está respondendo
- [ ] Verificar integração com Superagent
- [ ] Verificar rastreamento com LiteralAI
- [ ] Monitoramento no Sentry está ativo
- [ ] Logs da Vercel não mostram erros

## 6. Performance e Segurança

- [ ] Cold start (tempo de primeira execução) aceitável
- [ ] Tempo de resposta dos endpoints principais < 2s
- [ ] Headers de segurança configurados corretamente:
  - [ ] `X-Content-Type-Options`
  - [ ] `X-Frame-Options`
  - [ ] `X-XSS-Protection`
  - [ ] `Referrer-Policy`

## 7. Documentação

- [ ] Documentação da API está atualizada
- [ ] Changelog atualizado com novas funcionalidades
- [ ] Equipe informada sobre o novo deploy

## 8. Rollback (se necessário)

Em caso de problemas críticos:

- [ ] Identificar o deploy estável anterior
- [ ] Promover deploy anterior para produção
- [ ] Notificar equipe sobre o rollback
- [ ] Documentar motivos do rollback para análise posterior

## Notas do Deploy

**Data:** ________________

**Responsável:** ________________

**Versão:** ________________

**Observações:**

________________________________________________________________________________

________________________________________________________________________________

________________________________________________________________________________