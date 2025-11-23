FROM ubuntu:22.04

RUN apt-get update && \
    apt-get install -y bind9 bind9utils bind9-doc && \
    rm -rf /var/lib/apt/lists/*

COPY named.conf /etc/bind/named.conf
COPY zones /etc/bind/zones

EXPOSE 53/udp
EXPOSE 53/tcp

CMD ["/usr/sbin/named", "-g"]
