# Dependabot Update Guide

## Sobre as atualizações automáticas

Este projeto está configurado para receber atualizações automáticas de dependências via Dependabot. No entanto, algumas atualizações de pacotes (especialmente grandes atualizações de versão como Next.js 13 para 15) podem causar problemas de compatibilidade.

## Configurações implementadas

Para garantir uma transição suave durante as atualizações de dependências, as seguintes medidas foram implementadas:

1. **Configurações de ESLint flexíveis**
   - Configurações mais permissivas durante a transição
   - Regras importantes definidas como "warn" em vez de "error"

2. **Flags de compatibilidade npm**
   - `legacy-peer-deps=true` - Permite compatibilidade com diferentes versões de pacotes
   - `strict-peer-dependencies=false` - Evita falhas por dependências conflitantes
   - `auto-install-peers=true` - Instala automaticamente dependências de pares

3. **Resolutions em package.json**
   - Garante que tipos React sejam consistentes em todo o projeto
   - Evita conflitos de tipagem durante atualizações

4. **Workflows GitHub Actions modificados**
   - Adicionadas flags `--max-warnings=100` para evitar falhas por avisos
   - Adicionado fallback `|| true` para continuar mesmo com erros de linting

## Como lidar com atualizações do Dependabot

1. Quando um PR do Dependabot é aberto, verifique:
   - Quais pacotes estão sendo atualizados
   - O tamanho das mudanças de versão (minor vs major)
   - Possíveis breaking changes

2. Para atualizações menores:
   - Geralmente podem ser mergeadas diretamente

3. Para atualizações maiores (como Next.js 13 → 15):
   - Faça checkout da branch e teste localmente
   - Verifique a documentação de migração oficial
   - Implemente as alterações necessárias
   - Atualize as configurações de ESLint, se necessário
   - Resolva quaisquer problemas de tipagem

## Testando PR do Dependabot

```bash
# Clonar o repositório (se ainda não tiver feito)
git clone https://github.com/lucasnobrega7/superagent-frontend.git
cd superagent-frontend

# Fazer checkout da branch do PR do Dependabot
git fetch origin
git checkout dependabot/npm_and_yarn/nome-da-branch

# Instalar dependências com flags de compatibilidade
npm install

# Testar a build
npm run build

# Verificar linting
npm run lint
```