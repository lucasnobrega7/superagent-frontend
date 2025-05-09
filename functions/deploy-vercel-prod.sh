#!/bin/bash

# Script otimizado para deploy em produção na Vercel
# Executa verificações e preparação antes do deploy

set -e # Termina o script se qualquer comando falhar

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=======================================${NC}"
echo -e "${BLUE}   DEPLOY DO PROJETO PARA VERCEL      ${NC}"
echo -e "${BLUE}=======================================${NC}"

# Verificar ambiente Node.js
NODE_VERSION=$(node -v)
echo -e "${BLUE}Versão do Node.js:${NC} $NODE_VERSION"
if [[ ! $NODE_VERSION =~ ^v18.* ]]; then
  echo -e "${YELLOW}AVISO: A versão recomendada do Node.js é 18.x${NC}"
  read -p "Deseja continuar mesmo assim? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Deploy cancelado.${NC}"
    exit 1
  fi
fi

# Verificar se o Vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
  echo -e "${YELLOW}Vercel CLI não encontrado. Instalando...${NC}"
  npm install -g vercel
else
  echo -e "${GREEN}Vercel CLI está instalado.${NC}"
fi

# Verificar estado do git
echo -e "${BLUE}Verificando status do git...${NC}"
if [[ -n $(git status -s) ]]; then
  echo -e "${YELLOW}Há alterações não comitadas:${NC}"
  git status -s
  read -p "Deseja continuar mesmo assim? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Deploy cancelado.${NC}"
    exit 1
  fi
fi

# Verificar se .env.production existe
if [ ! -f .env.production ]; then
  echo -e "${RED}Arquivo .env.production não encontrado!${NC}"
  echo -e "${YELLOW}Criando .env.production a partir de .env.production.example...${NC}"
  
  if [ -f .env.production.example ]; then
    cp .env.production.example .env.production
    echo -e "${YELLOW}ATENÇÃO: .env.production foi criado, mas você precisa preencher os valores corretos.${NC}"
    echo -e "${YELLOW}Edite o arquivo antes de continuar.${NC}"
    read -p "Pressione Enter para continuar quando estiver pronto ou Ctrl+C para cancelar."
  else
    echo -e "${RED}Arquivo .env.production.example também não encontrado. Não é possível continuar.${NC}"
    exit 1
  fi
fi

# Limpar diretório lib
echo -e "${BLUE}Limpando diretório de build...${NC}"
rm -rf lib

# Instalar dependências
echo -e "${BLUE}Instalando dependências...${NC}"
npm ci

# Executar lint
echo -e "${BLUE}Executando lint...${NC}"
npm run lint

# Executar testes
echo -e "${BLUE}Executando testes...${NC}"
npm test || {
  echo -e "${YELLOW}Alguns testes falharam. Deseja continuar? (y/N)${NC}"
  read -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Deploy cancelado.${NC}"
    exit 1
  fi
}

# Gerar build
echo -e "${BLUE}Gerando build otimizado para Vercel...${NC}"
npm run build:vercel

# Verificar se o build foi bem-sucedido
if [ ! -d lib ]; then
  echo -e "${RED}Falha no build! Diretório 'lib' não encontrado.${NC}"
  exit 1
fi

echo -e "${GREEN}Build concluído com sucesso!${NC}"

# Perguntar se deseja fazer deploy para produção
echo -e "${YELLOW}ATENÇÃO: Você está prestes a fazer deploy em PRODUÇÃO na Vercel.${NC}"
echo -e "${YELLOW}Este processo afetará o ambiente de produção.${NC}"
read -p "Deseja continuar com o deploy para produção? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${BLUE}Deploy cancelado pelo usuário.${NC}"
  exit 0
fi

# Executar deploy na Vercel
echo -e "${BLUE}Iniciando deploy para produção na Vercel...${NC}"
vercel --prod

# Verificar resultado do deploy
if [ $? -eq 0 ]; then
  echo -e "${GREEN}Deploy para produção concluído com sucesso!${NC}"
  echo -e "${BLUE}=======================================${NC}"
  echo -e "${BLUE}   VERIFICAÇÕES PÓS-DEPLOY           ${NC}"
  echo -e "${BLUE}=======================================${NC}"
  echo -e "${YELLOW}1. Verifique o dashboard da Vercel para confirmar o status do deploy${NC}"
  echo -e "${YELLOW}2. Teste a API em produção com alguns endpoints-chave${NC}"
  echo -e "${YELLOW}3. Verifique os logs na Vercel para identificar problemas${NC}"
  echo -e "${YELLOW}4. Monitore o Sentry para possíveis erros após o deploy${NC}"
else
  echo -e "${RED}Falha no deploy para produção. Verifique os logs acima.${NC}"
fi

exit 0