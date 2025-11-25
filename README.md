# Projeto — Arquitetura com RR DNS + 3 Web Servers + Backend + Redis + PostgreSQL + Docker + TypeScript


Este projeto mostra como usar Round‑Robin DNS para balancear tráfego entre múltiplos servidores web, enquanto o estado de sessão é centralizado em Redis e a camada de aplicação comunica-se com PostgreSQL.

- Principais componentes:
- Round‑Robin DNS (BIND / named)
- 3 servidores Web (Node.js + TypeScript + Nginx)
- API Backend (Node.js + TypeScript)
- Redis para armazenamento de sessões
- PostgreSQL para armazenamento relacional
- Docker Compose para orquestração de containers


**Arquitetura (simplificada)**

  BIND / named (www.meutrabalho.com.br)
         │
    ─────┼──────────┬──────────
     web1      web2      web3   (Node + Express + Session)
        \       |       /
         \      |      /
          ─────────────   (API Backend)
                 │
             PostgreSQL
                 │
                Redis

## Rápido — Como executar

No diretório raiz do projeto, construa e suba os serviços com Docker Compose:

```bash
docker compose up -d --build
```

Para parar e remover containers:

```bash
docker compose down
```

Serviços esperados (nomes de containers): `dns`, `web1`, `web2`, `web3`, `api`, `redis`, `postgres`.

## Testando o Round‑Robin DNS


No host (ou em outra máquina na mesma rede Docker), consulte o servidor DNS (BIND/named) com `dig` apontando para o IP do container DNS:

```bash
dig +short @172.20.0.10 www.meutrabalho.com.br A
```

A saída deve alternar entre os IPs dos servidores web (ex.: `172.20.0.11`, `172.20.0.12`, `172.20.0.13`).


Se quiser que seu navegador utilize o servidor DNS (BIND/named) localmente (requer privilégios):

```bash
sudo cp /etc/resolv.conf /tmp/resolv.conf.bak
echo "nameserver 172.20.0.10" | sudo tee /etc/resolv.conf
# Abrir http://www.meutrabalho.com.br no navegador
```

Restaure o DNS do sistema com:

```bash
sudo mv /tmp/resolv.conf.bak /etc/resolv.conf
```

Obs: Modificar `/etc/resolv.conf` pode afetar a conectividade do sistema — proceda com cuidado.

## Alterando o DNS com o script `utils/dns-toggle.sh`

Para facilitar a troca temporária do resolvedor do sistema para o DNS do ambiente Docker (BIND/named) há um script utilitário em `utils/dns-toggle.sh`.

Uso principal (executar com privilégios):

```bash
# Aponta o sistema para o DNS do container e aplica ajustes necessários
sudo ./utils/dns-toggle.sh docker

# Restaura as configurações DNS padrão quando terminar
sudo ./utils/dns-toggle.sh restore
```

O que o script faz (resumo):
- Ajusta o resolvedor da interface (`resolvectl dns <IFACE> <DOCKER_DNS>`).
- Tenta limpar e definir regras/ política `FORWARD` em `iptables` (evita bloqueio entre host e containers).
- Verifica se o host de teste (`www.meutrabalho.com.br`) resolve para os IPs esperados.
- Ao restaurar, repõe os DNS padrão (por padrão `8.8.8.8 1.1.1.1`) e restaura `/etc/resolv.conf` a partir do backup criado pelo script.

Configurações importantes dentro do script (edite se necessário):
- `IFACE` — nome da interface de rede do host (ex.: `enp0s3`, `eth0`).
- `DOCKER_DNS` — IP do container BIND (ex.: `172.20.0.10`).
- `RESTORE_DNS` — servidores DNS usados ao restaurar.
- `TEST_HOST` e `EXPECTED_IPS` — usados para validar se a resolução ocorreu como esperado.

Requisitos e observações:
- O script usa `resolvectl` (systemd-resolved); se seu sistema for diferente, ajuste o script.
- Opcionalmente usa `dig` ou `nslookup` para validar resolução — instale `dnsutils`/`bind9-dnsutils` se precisar.
- O script cria um backup de `/etc/resolv.conf` em `/etc/resolv.conf.projeto_redes_2.bak` antes de sobrescrever — esse backup é removido ao restaurar.
- O script precisa de privilégios (uso de `sudo`) para aplicar `resolvectl` e alterar `iptables`.

Se a validação falhar após `docker`, verifique:
- regras de `iptables` (`sudo iptables -L -n -v`),
- se o serviço BIND/named está rodando no container e se as zonas estão corretas, e
- se `dig +short @<DOCKER_DNS> www.meutrabalho.com.br A` retorna os IPs esperados.
OBS.: Na versão atual a saída indica falha mas o DNS está sendo alterado.

## Sessões distribuídas com Redis

- Os servidores web usam `express-session` + `connect-redis`.
- A sessão do usuário é gravada no Redis; quando o Round‑Robin leva uma requisição para outro servidor, a sessão é lida do Redis .

Fluxo simples:
- Cliente → `web1` (cria sessão) → sessão salva em Redis
- Próxima requisição → `web2` (lê sessão no Redis) → usuário continua autenticado

## API Backend

O backend expõe endpoints REST (em `backend/src`). Um endpoint de teste:

```http
GET /api/ping
Response: { "ok": true }
```

Outros endpoints (CRUD) interagem com o PostgreSQL; verifique `backend/src/routes.ts` para rotas disponíveis.

## Estrutura de pastas (resumida)

```
/projeto
  docker-compose.yml
  README.md
  /dns
  /web1
  /web2
  /web3
  /backend
  /db
  /redis
  /utils
```

## Variáveis de ambiente importantes

- `backend/.env` — configurações da API (porta, conexão com DB, Redis)
- `db/.env` — configuração do PostgreSQL (senha, usuário)
- Se alterar IPs de rede Docker, atualize as referências de DNS e `docker-compose.yml` conforme necessário.

## Comandos úteis

- Subir containers: `docker compose up -d --build`
- Ver containers: `docker ps`
- Logs de um container: `docker logs -f <container>`
- Parar e remover: `docker compose down`

## Troubleshooting rápido

- Se o DNS não rotacionar, verifique o container `dns` e o arquivo de zonas.
- Se sessão não persistir entre web servers, confirme a conexão Redis e as configs em `web*/src/session.ts`.
- Se a API não conecta ao PostgreSQL, verifique `db/init.sql`, variáveis de ambiente e logs do container `postgres`.

## Testes e verificação

- `dig` para verificar RR DNS.
- Abrir `http://www.meutrabalho.com.br` e atualizar várias vezes para ver revezamento entre `web1|web2|web3`.
- Usar `curl http://localhost:<api_port>/api/ping` para checar o backend.

