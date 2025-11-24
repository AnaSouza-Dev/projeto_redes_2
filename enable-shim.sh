#!/usr/bin/env bash
# Le .env no diretório do repo; cria docker macvlan network e macvlan-shim no host
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$REPO_ROOT/.env"

if grep -qi microsoft /proc/version 2>/dev/null || grep -qi wsl /proc/version 2>/dev/null; then
  echo "WSL2/Docker Desktop detectado. macvlan frequentemente NÃO funciona aí."
  echo "Use uma VM Linux ou rode os containers num host Linux físico."
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo ".env não encontrado. copie .env.example e edite antes de executar."
  exit 1
fi

# carrega variáveis
set -o allexport
source "$ENV_FILE"
set +o allexport

NET_NAME=macvlan2

# checa interface
if ! ip link show "$PARENT_INTERFACE" >/dev/null 2>&1; then
  echo "Interface $PARENT_INTERFACE não existe. Ajuste PARENT_INTERFACE em .env."
  exit 1
fi

# cria docker network se não existir
if ! docker network ls --filter name=^${NET_NAME}$ --format '{{.Name}}' | grep -q "^${NET_NAME}$"; then
  echo "Criando docker network ${NET_NAME}..."
  docker network create -d macvlan \
    --subnet=${MACVLAN_SUBNET} --gateway=${MACVLAN_GATEWAY} \
    -o parent=${PARENT_INTERFACE} ${NET_NAME}
else
  echo "Docker network ${NET_NAME} já existe."
fi

# cria macvlan-shim para que o host enxergue os IPs (single /32)
SHIM_IF=macvlan-shim
if ! ip link show "$SHIM_IF" >/dev/null 2>&1; then
  echo "Criando macvlan shim $SHIM_IF ..."
  sudo ip link add $SHIM_IF link $PARENT_INTERFACE type macvlan mode bridge
  sudo ip addr add ${HOST_SHIM_IP}/32 dev $SHIM_IF
  sudo ip link set $SHIM_IF up
  echo "Shim criado com IP ${HOST_SHIM_IP}. Você pode pingar ${WEB1_MACVLAN_IP} etc."
else
  echo "Shim $SHIM_IF já existe."
fi

echo "Pronto. Agora rode: docker compose up -d --build"