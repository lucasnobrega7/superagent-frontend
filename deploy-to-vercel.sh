#!/bin/bash

# Script para deploy do frontend no Vercel
# Utiliza o Vercel ID fornecido para autenticação

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Iniciando deploy do frontend para Vercel ===${NC}"

# Verificar se o Vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}Vercel CLI não encontrado. Instalando...${NC}"
    npm install -g vercel
fi

# Definir variáveis de ambiente
VERCEL_TOKEN="tJklC8KVAJoNrJwPs6YPmPpi"
VERCEL_ID="LXpOEOvDcY0NthmLMlXLYoI6"
VERCEL_EMAIL="lucasnobregar@gmail.com"
VERCEL_PROJECT_ID="prj_FC48uY4qzb4HWYjf2sYeseqYZN32"

# Login no Vercel usando token (silencioso)
echo -e "${YELLOW}Fazendo login no Vercel...${NC}"
echo "${VERCEL_TOKEN}" | vercel login --token=${VERCEL_TOKEN} &>/dev/null

# Verificar se o login foi bem sucedido
if [ $? -ne 0 ]; then
    echo -e "${RED}Falha ao fazer login no Vercel. Verifique suas credenciais.${NC}"
    exit 1
fi

echo -e "${GREEN}Login no Vercel bem sucedido!${NC}"

# Perguntar se deve prosseguir com o deploy
echo -e "${YELLOW}Deseja prosseguir com o deploy para produção? (y/n)${NC}"
read -r deploy_confirm

if [[ $deploy_confirm != "y" ]]; then
    echo -e "${YELLOW}Deploy cancelado pelo usuário.${NC}"
    vercel logout &>/dev/null
    exit 0
fi

# Configurar variáveis de ambiente para o deploy
echo -e "${YELLOW}Configurando variáveis de ambiente...${NC}"

# Preparar deploy
echo -e "${GREEN}Iniciando deploy para produção...${NC}"
vercel deploy --prod --yes --token=${VERCEL_TOKEN}

# Verificar resultado do deploy
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Deploy concluído com sucesso!${NC}"
    echo -e "Acesse o dashboard para mais detalhes: ${YELLOW}https://vercel.com/agentesdeconversao/ag-1${NC}"
else
    echo -e "${RED}Ocorreu um erro durante o deploy.${NC}"
    echo -e "Verifique o log acima para detalhes ou acesse: ${YELLOW}https://vercel.com/agentesdeconversao/ag-1${NC}"
fi

# Logout para segurança
vercel logout &>/dev/null