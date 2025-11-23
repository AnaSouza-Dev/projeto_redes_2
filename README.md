# Projeto — Arquitetura com RR DNS + 3 Web Servers + Backend + Redis + PostgreSQL + Docker + TypeScript

Projeto demonstrativo de uma arquitetura distribuída usando:

- Round‑Robin DNS (CoreDNS)
- 3 servidores Web (Node.js + TypeScript)
- Backend API (Node.js + TypeScript)
- Redis para sessões
- PostgreSQL como banco de dados
- Docker Compose para orquestração

Ideal para apresentações acadêmicas ou demonstrações de alta disponibilidade com sticky sessions distribuídas.

## Arquitetura geral

    +-------------------+
    |   CoreDNS (RR)    |
    | www.meutrabalho   |
    +---------+---------+
              |
    -----------------------------
    |           |               |
  WEB1        WEB2            WEB3
  (TS)        (TS)            (TS)
   \           |               /
    \          |              /
      -----------------------
      |     API Backend     |
      |  Node.js + TS + PG  |
      -----------------------
               |
           PostgreSQL
               |
             Redis

## 1. Como executar o projeto

No diretório do projeto:

```bash
docker compose up -d --build
```

Containers levantados:
- CoreDNS
- web1, web2, web3
- api
- redis
- postgresql

Para parar tudo:

```bash
docker compose down
```

## 2. Testando o RR DNS

No host (ex.: dentro de uma máquina na mesma rede Docker), use `dig` apontando para o CoreDNS:

```bash
dig +short @172.20.0.10 www.meutrabalho.com.br A
```

Saída esperada (deve alternar entre):

```
172.20.0.11
172.20.0.12
172.20.0.13
```

## 3. Acessando pelo navegador

Para que o navegador use o CoreDNS como resolvedor (Linux/WSL/macOS com privilégios), faça backup do `resolv.conf` e aponte para o CoreDNS:

```bash
sudo cp /etc/resolv.conf /tmp/resolv.conf.bak
echo "nameserver 172.20.0.10" | sudo tee /etc/resolv.conf
```

Abra no navegador:

```
http://www.meutrabalho.com.br
```

Atualize várias vezes — cada refresh deve cair em web1, web2 ou web3.

Para restaurar o DNS:

```bash
sudo mv /tmp/resolv.conf.bak /etc/resolv.conf
```

> Observação: alterar `/etc/resolv.conf` requer privilégios e pode afetar conectividade do sistema — use com cuidado.

## 4. Sessões com Redis

Cada web server usa:
- `express-session`
- `connect-redis` (RedisStore)
- Cookie de sessão

Fluxo:
- Usuário acessa web1 → sessão gravada no Redis
- RR DNS direciona para web2 → sessão persistida pelo Redis (sticky sessions distribuídas)

## 5. Estrutura de pastas

```
/projeto
  docker-compose.yml
  README.md
  /dns
    Corefile
    db.meutrabalho.com.br
  /web1
  /web2
  /web3
  /api
  /postgres
  /redis (se necessário)
```

## 6. Backend (API)

API simples com CRUD no PostgreSQL.

Exemplo de endpoint para testar comunicação:

```
GET /api/ping
→ { "ok": true }
```

## 7. Comandos úteis

Ver containers em execução:

```bash
docker ps
```

Logs de um container:

```bash
docker logs web1 -f
```

Parar todos os containers:

```bash
docker compose down
```

---
Mantido para demonstração e estudo. Ajuste IPs (ex.: `172.20.0.10`) conforme sua rede Docker ou compose network.
