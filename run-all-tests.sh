#!/bin/bash
# Script para executar todos os testes do projeto

set -e

echo "======================================"
echo "  Executando Testes do Projeto"
echo "======================================"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para exibir resultados
print_result() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1 - SUCESSO${NC}"
    else
        echo -e "${RED}✗ $1 - FALHOU${NC}"
        return 1
    fi
}

# Backend
echo -e "${YELLOW}[1/4] Testando Backend...${NC}"
cd backend
npm test
print_result "Backend"
cd ..
echo ""

# Web Server 1
echo -e "${YELLOW}[2/4] Testando Web Server 1...${NC}"
cd web1
npm test
print_result "Web Server 1"
cd ..
echo ""

# Web Server 2
echo -e "${YELLOW}[3/4] Testando Web Server 2...${NC}"
cd web2
npm test
print_result "Web Server 2"
cd ..
echo ""

# Web Server 3
echo -e "${YELLOW}[4/4] Testando Web Server 3...${NC}"
cd web3
npm test
print_result "Web Server 3"
cd ..
echo ""

echo "======================================"
echo -e "${GREEN}  Testes Concluídos!${NC}"
echo "======================================"
echo ""
echo "Para ver cobertura de código, execute:"
echo "  cd backend && npm run test:coverage"
echo "  cd web1 && npm run test:coverage"
echo "  cd web2 && npm run test:coverage"
echo "  cd web3 && npm run test:coverage"
