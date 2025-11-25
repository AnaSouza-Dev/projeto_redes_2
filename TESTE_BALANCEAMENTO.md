# 🔄 Testando Balanceamento Round-Robin com Sessão Mantida

## O que foi configurado

### 1. **DNS Round-Robin** (TTL = 0)
- Cada consulta DNS retorna um servidor diferente
- TTL configurado para 0 força resolução a cada requisição
- Ordem cíclica entre `172.20.0.11`, `172.20.0.12`, `172.20.0.13`

### 2. **Sessão Centralizada no Redis**
- Todos os servidores web (web1, web2, web3) compartilham o mesmo Redis
- Cookie de sessão válido por 24 horas
- Flags de segurança: `httpOnly`, `sameSite: 'lax'`

### 3. **Identificação do Servidor**
- Cada servidor exibe seu nome em um badge colorido
- Mostra qual servidor está processando a requisição

## Como Testar

### Passo 1: Subir os containers
```bash
cd /home/lab/projeto_redes_2
docker compose up -d --build
```

### Passo 2: Configurar DNS do sistema
```bash
sudo ./utils/dns-toggle.sh docker
```

Este comando:
- Configura o resolvedor para usar o DNS do container (172.20.0.10)
- Valida se a resolução está funcionando
- Ajusta iptables se necessário

### Passo 3: Testar resolução DNS
```bash
# Executar várias vezes e observar IPs diferentes
dig +short www.meutrabalho.com.br @172.20.0.10

# Deve alternar entre:
# 172.20.0.11 (Web Server 1)
# 172.20.0.12 (Web Server 2)
# 172.20.0.13 (Web Server 3)
```

### Passo 4: Acessar no navegador
1. Abra o navegador
2. Acesse: `http://www.meutrabalho.com.br`
3. Crie uma conta ou faça login
4. **Observe o badge colorido** mostrando qual servidor está respondendo

### Passo 5: Atualizar a página (F5)
1. Pressione **F5** para recarregar a página
2. **Observe que**:
   - ✅ A **sessão é mantida** (você continua logado)
   - ✅ O **servidor muda** (badge mostra servidor diferente)
   - ✅ Seus **dados de usuário permanecem** (nome, email)

### Passo 6: Verificar logs dos containers
```bash
# Ver logs de todos os web servers
docker logs web1 -f &
docker logs web2 -f &
docker logs web3 -f

# Você verá requisições sendo distribuídas entre os servidores
```

## Evidências do Balanceamento

### No navegador:
- Badge muda de "Web Server 1" → "Web Server 2" → "Web Server 3" ao atualizar
- URL permanece `www.meutrabalho.com.br`
- Dados do usuário continuam visíveis

### No terminal:
```bash
# Testar com curl (fazer login primeiro)
curl -v http://www.meutrabalho.com.br/home -c cookies.txt
curl -v http://www.meutrabalho.com.br/home -b cookies.txt
curl -v http://www.meutrabalho.com.br/home -b cookies.txt

# Observe o header Server nos logs ou IP de destino mudando
```

### No Redis:
```bash
# Verificar sessões armazenadas
docker exec -it redis_sessions redis-cli
> KEYS *
> GET sess:XXXXX  # Substituir pelo ID da sessão
```

## Troubleshooting

### Navegador sempre vai para o mesmo servidor
**Causa**: Cache DNS do navegador ou do sistema

**Solução**:
```bash
# Limpar cache DNS do sistema
sudo resolvectl flush-caches

# No navegador:
# Chrome: chrome://net-internals/#dns → Clear host cache
# Firefox: about:networking#dns → Clear DNS Cache
```

### Sessão não é mantida
**Causa**: Cookies não estão sendo salvos

**Solução**:
1. Verificar se o backend está rodando: `docker logs api`
2. Verificar Redis: `docker exec -it redis_sessions redis-cli ping`
3. Limpar cookies do navegador e fazer login novamente

### DNS não resolve
**Causa**: Configuração DNS não aplicada

**Solução**:
```bash
# Re-executar o script
sudo ./utils/dns-toggle.sh restore
sudo ./utils/dns-toggle.sh docker

# Verificar resolução manualmente
nslookup www.meutrabalho.com.br 172.20.0.10
```

## Restaurar Configuração Original

Quando terminar os testes:
```bash
sudo ./utils/dns-toggle.sh restore
```

Isso restaura o DNS padrão do sistema.

## Arquitetura

```
Navegador
    ↓
DNS Round-Robin (172.20.0.10)
    ↓ (resolve aleatoriamente para)
    ├─→ Web Server 1 (172.20.0.11:8081) ─┐
    ├─→ Web Server 2 (172.20.0.12:8082) ─┼─→ Redis (sessões)
    └─→ Web Server 3 (172.20.0.13:8083) ─┘
                ↓
           Backend API (172.20.0.20:8080)
                ↓
            MySQL DB (172.20.0.40:3306)
```

## Configurações Aplicadas

### DNS (`dns/zones/meutrabalho.com.br.db`)
```
$TTL 0
www     0   IN  A       172.20.0.11
www     0   IN  A       172.20.0.12
www     0   IN  A       172.20.0.13
```

### Sessão (`*/src/session.ts`)
```typescript
cookie: {
  httpOnly: true,
  sameSite: 'lax',
  maxAge: 1000 * 60 * 60 * 24  // 24 horas
}
```

### BIND (`dns/named.conf`)
```
rrset-order {
  class IN type A name "www.meutrabalho.com.br" order cyclic;
};
minimal-responses yes;
```

## Resultados Esperados

✅ **Round-Robin funcionando**: Servidores alternam a cada requisição  
✅ **Sessão mantida**: Usuário continua autenticado  
✅ **Dados persistentes**: Informações no Redis compartilhadas  
✅ **TTL = 0**: Sem cache DNS  
✅ **Identificação visual**: Badge mostra qual servidor responde  
