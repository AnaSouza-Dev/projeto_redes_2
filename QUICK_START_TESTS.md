# 🧪 Início Rápido - Testes Unitários

## Instalação

```bash
# Instalar todas as dependências de teste
./install-test-deps.sh
```

## Executar Testes

```bash
# Todos os componentes
./run-all-tests.sh

# Backend apenas
cd backend && npm test

# Web Server 1 apenas
cd web1 && npm test

# Com cobertura
cd backend && npm run test:coverage
```

## Estrutura

```
projeto_redes_2/
├── backend/
│   ├── src/
│   │   ├── __tests__/
│   │   │   ├── setup.ts
│   │   │   ├── routes.test.ts
│   │   │   ├── session.test.ts
│   │   │   └── db.test.ts
│   │   ├── routes.ts
│   │   ├── session.ts
│   │   └── db.ts
│   ├── jest.config.js
│   └── package.json
│
├── web1/
│   ├── src/
│   │   ├── __tests__/
│   │   │   ├── setup.ts
│   │   │   └── server.test.ts
│   │   └── index.ts
│   ├── jest.config.js
│   └── package.json
│
├── TESTS.md                    # Documentação completa
├── TEST_SUMMARY.md             # Sumário dos testes
├── run-all-tests.sh            # Script para executar todos os testes
└── install-test-deps.sh        # Script de instalação
```

## O que foi testado?

### Backend
✅ Rotas da API (GET/POST /api/users, /api/login, /api/logout, /api/me)  
✅ Módulo de sessão (Redis, middleware)  
✅ Módulo de banco de dados (MySQL pool)  

### Web Servers
✅ Rotas principais (/, /home, /profile, /login)  
✅ Health check (/healthz)  
✅ Autenticação e redirecionamentos  

## Comandos Úteis

```bash
# Modo watch (re-executa ao salvar)
npm run test:watch

# Apenas um arquivo
npm test routes.test.ts

# Com verbose
npm test -- --verbose

# Cobertura
npm run test:coverage
```

## Visualizar Cobertura

Após executar `npm run test:coverage`:

```bash
# Abrir relatório HTML
cd backend
open coverage/lcov-report/index.html  # macOS
xdg-open coverage/lcov-report/index.html  # Linux
```

## Adicionar Novos Testes

1. Criar arquivo `*.test.ts` em `src/__tests__/`
2. Importar dependências:
```typescript
import request from 'supertest';
import express from 'express';
```

3. Escrever testes:
```typescript
describe('Minha Funcionalidade', () => {
  it('should do something', async () => {
    // Arrange, Act, Assert
    expect(result).toBe(expected);
  });
});
```

4. Executar: `npm test`

## Verificar Tudo Funciona

```bash
# 1. Instalar dependências
./install-test-deps.sh

# 2. Executar testes
./run-all-tests.sh

# 3. Verificar cobertura
cd backend && npm run test:coverage
```

Se tudo estiver verde ✅, os testes estão funcionando!

## Documentação Completa

📖 Para mais detalhes, consulte [TESTS.md](./TESTS.md)

## Suporte

Problemas comuns:

**Erro: Cannot find module**
```bash
npm install
```

**Erro: Port in use**
Testes usam mocks, não afetam portas reais.

**TypeScript errors**
Instale dependências de tipos:
```bash
npm install --save-dev @types/jest @types/node
```
