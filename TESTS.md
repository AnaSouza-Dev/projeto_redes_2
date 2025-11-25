# Testes Unitários do Projeto

Este projeto possui uma suíte completa de testes unitários para garantir a qualidade e confiabilidade dos componentes.

## Estrutura de Testes

### Backend (`/backend`)
- **routes.test.ts**: Testes para todas as rotas da API
  - GET /api/users
  - POST /api/users (criação de usuários)
  - POST /api/login
  - POST /api/logout
  - GET /api/me

- **session.test.ts**: Testes para o módulo de sessão
  - Configuração do Redis
  - Middleware de sessão
  - Tratamento de erros de conexão

- **db.test.ts**: Testes para o módulo de banco de dados
  - Pool de conexões MySQL
  - Configurações de ambiente

### Web Servers (`/web1`, `/web2`, `/web3`)
- **server.test.ts**: Testes para rotas dos servidores web
  - GET / (redirecionamento)
  - GET /healthz
  - GET /login
  - GET /home
  - GET /profile
  - Autenticação e sessões

## Executando os Testes

### Pré-requisitos
Instale as dependências antes de executar os testes:

```bash
# Backend
cd backend
npm install

# Web Server 1
cd web1
npm install

# Web Server 2
cd web2
npm install

# Web Server 3
cd web3
npm install
```

### Comandos de Teste

#### Backend
```bash
cd backend

# Executar todos os testes
npm test

# Executar testes em modo watch (re-executa ao salvar arquivos)
npm run test:watch

# Executar testes com cobertura de código
npm run test:coverage
```

#### Web Servers
```bash
cd web1  # ou web2, web3

# Executar todos os testes
npm test

# Executar testes em modo watch
npm run test:watch

# Executar testes com cobertura de código
npm run test:coverage
```

### Executar Todos os Testes do Projeto

Use o script auxiliar na raiz do projeto:

```bash
./run-all-tests.sh
```

## Cobertura de Testes

Após executar `npm run test:coverage`, você pode visualizar o relatório de cobertura:

- **Terminal**: Resumo exibido automaticamente
- **HTML**: Abra `coverage/lcov-report/index.html` no navegador

### Metas de Cobertura
- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

## Tecnologias Utilizadas

- **Jest**: Framework de testes
- **ts-jest**: Preprocessador TypeScript para Jest
- **Supertest**: Testes de requisições HTTP
- **@types/jest**: Tipos TypeScript para Jest

## Estrutura de Arquivos de Teste

```
backend/
├── src/
│   ├── __tests__/
│   │   ├── setup.ts          # Configuração global dos testes
│   │   ├── routes.test.ts    # Testes das rotas da API
│   │   ├── session.test.ts   # Testes de sessão
│   │   └── db.test.ts        # Testes de banco de dados
│   ├── routes.ts
│   ├── session.ts
│   └── db.ts
└── jest.config.js            # Configuração do Jest

web1/
├── src/
│   ├── __tests__/
│   │   ├── setup.ts          # Configuração global dos testes
│   │   └── server.test.ts    # Testes do servidor web
│   ├── index.ts
│   └── session.ts
└── jest.config.js            # Configuração do Jest
```

## Boas Práticas

1. **Isolamento**: Cada teste é independente e não afeta outros testes
2. **Mocks**: Dependências externas (DB, Redis) são mockadas
3. **Clareza**: Nomes descritivos para testes (`it('should...')`)
4. **Cobertura**: Testes cobrem casos de sucesso e falha
5. **Velocidade**: Testes unitários executam rapidamente

## Adicionando Novos Testes

### Exemplo de Teste Simples

```typescript
import request from 'supertest';
import express from 'express';

describe('Nova Funcionalidade', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    app.get('/nova-rota', (req, res) => {
      res.json({ mensagem: 'Olá!' });
    });
  });

  it('should return greeting message', async () => {
    const response = await request(app).get('/nova-rota');
    
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ mensagem: 'Olá!' });
  });
});
```

## Troubleshooting

### Erro: "Cannot find module"
```bash
npm install
```

### Erro: "Port already in use"
Os testes usam servidores mockados, não afetam os containers Docker.

### Testes lentos
Use `npm run test:watch` para executar apenas testes modificados.

### Erro de tipos TypeScript
```bash
npm install --save-dev @types/jest @types/node @types/supertest
```

## CI/CD

Os testes podem ser integrados em pipelines de CI/CD:

```yaml
# Exemplo GitHub Actions
- name: Run Tests
  run: |
    cd backend && npm test
    cd ../web1 && npm test
    cd ../web2 && npm test
    cd ../web3 && npm test
```

## Relatórios

### Coverage HTML
Após `npm run test:coverage`, abra:
- `backend/coverage/lcov-report/index.html`
- `web1/coverage/lcov-report/index.html`

### JUnit XML (para CI)
Configure no `jest.config.js`:
```javascript
reporters: ['default', 'jest-junit']
```

## Contribuindo

Ao adicionar novas funcionalidades:
1. Escreva testes primeiro (TDD)
2. Mantenha cobertura > 80%
3. Execute `npm test` antes de commit
4. Atualize esta documentação se necessário

## Contato

Para dúvidas sobre testes, consulte a documentação do Jest:
https://jestjs.io/docs/getting-started
