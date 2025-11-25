#!/usr/bin/env bash
set -e

# Interface principal — ajuste se necessário
IFACE="enp0s3"

# IP do seu DNS Docker
DOCKER_DNS="172.20.0.10"

# DNS padrão após restore
RESTORE_DNS="8.8.8.8 1.1.1.1"

# Domínio e IPs esperados pelo nosso BIND
TEST_HOST="www.meutrabalho.com.br"
EXPECTED_IPS=("172.20.0.11" "172.20.0.12" "172.20.0.13")

# Verifica se o servidor DNS retorna exatamente os IPs esperados para TEST_HOST
test_dns_reachable() {
    # Tenta dig primeiro (sem especificar servidor: usa o resolver do host)
    if command -v dig >/dev/null 2>&1; then
        out="$(timeout 3 dig "${TEST_HOST}" +short 2>/dev/null || true)"
        if [[ -z "${out}" ]]; then
            return 1
        fi
        for ip in "${EXPECTED_IPS[@]}"; do
            echo "${out}" | grep -xF -- "${ip}" >/dev/null 2>&1 || return 1
        done
        return 0
    fi

    # Fallback: nslookup (extrai todos os IPs presentes na saída)
    if command -v nslookup >/dev/null 2>&1; then
        out="$(timeout 3 nslookup "${TEST_HOST}" 2>/dev/null || true)"
        if [[ -z "${out}" ]]; then
            return 1
        fi
        ips="$(echo "${out}" | grep -Eo '[0-9]{1,3}(\.[0-9]{1,3}){3}' | sort -u)"
        for ip in "${EXPECTED_IPS[@]}"; do
            echo "${ips}" | grep -xF -- "${ip}" >/dev/null 2>&1 || return 1
        done
        return 0
    fi

    # Sem ferramentas, não valida
    return 1
}

apply_docker_dns() {
    echo "[INFO] Aplicando DNS DOCKER ($DOCKER_DNS) na interface $IFACE..."

    sudo resolvectl dns "$IFACE" "$DOCKER_DNS"
    # não reiniciamos systemd-resolved aqui — reiniciar pode fazer com que
    # o gerenciador de rede (NetworkManager/DHCP) sobrescreva a configuração.
    sudo resolvectl flush-caches || true

    echo "[INFO] DNS aplicado via resolvectl. Liberando FORWARD no iptables..."

    # Libera encaminhamento que pode estar bloqueando o tráfego entre containers/host
    # Detecta se estamos como root; evita usar `sudo` quando já for root.
    if [[ "$EUID" -eq 0 ]]; then
        SUDO_CMD=""
    else
        SUDO_CMD="sudo"
    fi

    IPT_CMD="$(command -v iptables || true)"
    if [[ -z "$IPT_CMD" ]]; then
        # fallback caminho comum
        IPT_CMD="/sbin/iptables"
    fi

    echo "[DEBUG] Usando iptables em: $IPT_CMD (sudo: ${SUDO_CMD:-no})"
    #aguardando mais tempo:
    sleep 10
    
    # Executa e captura saída para diagnóstico caso falhe
    if ! $SUDO_CMD "$IPT_CMD" -F FORWARD 2>/tmp/dns_toggle_iptables_err || true; then
        echo "[WARN] Falha ao limpar FORWARD: $(cat /tmp/dns_toggle_iptables_err 2>/dev/null)"
    else
        echo "[INFO] Flush FORWARD executado com sucesso"
    fi

    if ! $SUDO_CMD "$IPT_CMD" -P FORWARD ACCEPT 2>/tmp/dns_toggle_iptables_err || true; then
        echo "[WARN] Falha ao definir política FORWARD ACCEPT: $(cat /tmp/dns_toggle_iptables_err 2>/dev/null)"
    else
        echo "[INFO] Política FORWARD definida como ACCEPT"
    fi

    # Aguarda pequenas mudanças tomarem efeito
    sleep 10

    # Teste simples de resolução após aplicar resolvectl + iptables
    if test_dns_reachable; then
        echo "[OK] Validação: servidor DNS ${DOCKER_DNS} respondeu com os IPs esperados."
    else
        echo "[WARN] Validação falhou: host não respondeu via ${DOCKER_DNS} após ajustar iptables."
        echo "[INFO] Você pode inspecionar regras iptables com: sudo iptables -L -n -v"
        exit 1
    fi
}

restore_dns() {
    echo "[INFO] Restaurando DNS padrão ($RESTORE_DNS)..."

    # Reverter NetworkManager se usado
    if command -v nmcli >/dev/null 2>&1; then
        conn_name=$(nmcli -t -f NAME,DEVICE connection show --active | awk -F: -v dev="$IFACE" '$2==dev{print $1; exit}')
        if [[ -n "$conn_name" ]]; then
            echo "[INFO] Revertendo configuração NetworkManager em '$conn_name'"
            sudo nmcli connection modify "$conn_name" ipv4.dns "" ipv4.ignore-auto-dns no >/dev/null 2>&1 || true
            sudo nmcli connection up "$conn_name" >/dev/null 2>&1 || true
        fi
    fi

    # Restaurar resolvectl para DNS padrão
    sudo resolvectl dns "$IFACE" $RESTORE_DNS || true
    sudo resolvectl flush-caches || true

    # Restaurar /etc/resolv.conf se fizemos backup
    BACKUP=/etc/resolv.conf.projeto_redes_2.bak
    if [[ -f "$BACKUP" ]]; then
        echo "[INFO] Restaurando /etc/resolv.conf a partir do backup"
        sudo cp "$BACKUP" /etc/resolv.conf || true
        sudo rm -f "$BACKUP" || true
        sudo systemctl restart systemd-resolved || true
    fi

    echo "[INFO] Restauração concluída. Verificando..."
    resolvectl dns "$IFACE" || true
}

if [[ "$1" == "docker" ]]; then
    apply_docker_dns
elif [[ "$1" == "restore" ]]; then
    restore_dns
else
    echo "Uso:"
    echo "  sudo ./utils/dns-toggle.sh docker     # ativa DNS do container"
    echo "  sudo ./utils/dns-toggle.sh restore    # restaura DNS normal"
    exit 1
fi

echo
#echo "[INFO] Conteúdo atual de /etc/resolv.conf:"
#cat /etc/resolv.conf
