#!/bin/bash
# Script de instalação rápida das dependências de teste

set -e

echo "======================================"
echo "  Instalando Dependências de Teste"
echo "======================================"
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}[1/4] Instalando dependências do Backend...${NC}"
cd backend
npm install
echo -e "${GREEN}✓ Backend - Concluído${NC}"
cd ..
echo ""

echo -e "${YELLOW}[2/4] Instalando dependências do Web Server 1...${NC}"
cd web1
npm install
echo -e "${GREEN}✓ Web Server 1 - Concluído${NC}"
cd ..
echo ""

echo -e "${YELLOW}[3/4] Instalando dependências do Web Server 2...${NC}"
cd web2
npm install
echo -e "${GREEN}✓ Web Server 2 - Concluído${NC}"
cd ..
echo ""

echo -e "${YELLOW}[4/4] Instalando dependências do Web Server 3...${NC}"
cd web3
npm install
echo -e "${GREEN}✓ Web Server 3 - Concluído${NC}"
cd ..
echo ""

echo "======================================"
echo -e "${GREEN}  Instalação Concluída!${NC}"
echo "======================================"
echo ""
echo "Para executar os testes:"
echo "  ./run-all-tests.sh"
echo ""
echo "Ou individualmente:"
echo "  cd backend && npm test"
echo "  cd web1 && npm test"
echo "  cd web2 && npm test"
echo "  cd web3 && npm test"
echo ""
