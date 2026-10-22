#!/usr/bin/env bash
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "Run with sudo: sudo deploy/bootstrap-oracle.sh" >&2
  exit 1
fi

TARGET_USER="${SUDO_USER:-ubuntu}"
export DEBIAN_FRONTEND=noninteractive

apt-get update
apt-get install -y --no-install-recommends \
  ca-certificates curl git gnupg lsb-release \
  iptables iptables-persistent fail2ban unattended-upgrades openssl

# Docker Engine + Compose v2 from Docker's official repository
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
. /etc/os-release
cat > /etc/apt/sources.list.d/docker.list <<EOF
deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable
EOF
apt-get update
apt-get install -y --no-install-recommends \
  docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

if id -u "$TARGET_USER" >/dev/null 2>&1; then
  usermod -aG docker "$TARGET_USER"
fi

# Bound container logs so a noisy deployment cannot fill the free disk.
mkdir -p /etc/docker
cat > /etc/docker/daemon.json <<'EOF'
{
  "log-driver": "json-file",
  "log-opts": { "max-size": "10m", "max-file": "3" }
}
EOF
systemctl enable --now docker
systemctl restart docker

# Swap keeps Next.js builds and Postgres comfortable on the 24 GB free shape.
if [ ! -f /swapfile ]; then
  fallocate -l 4G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

cat > /etc/sysctl.d/99-taskflow.conf <<'EOF'
net.core.somaxconn=4096
net.ipv4.tcp_max_syn_backlog=8192
net.ipv4.ip_local_port_range=10240 65000
fs.file-max=200000
vm.swappiness=10
EOF
sysctl --system >/dev/null

# Open HTTP/HTTPS on the instance itself. The Oracle VCN security list must
# also allow inbound TCP 80 and 443 (and 22 for SSH).
if ! iptables -C INPUT -p tcp --dport 80 -j ACCEPT 2>/dev/null; then
  iptables -I INPUT 1 -p tcp --dport 80 -j ACCEPT
fi
if ! iptables -C INPUT -p tcp --dport 443 -j ACCEPT 2>/dev/null; then
  iptables -I INPUT 1 -p tcp --dport 443 -j ACCEPT
fi
netfilter-persistent save >/dev/null

systemctl enable --now fail2ban
dpkg-reconfigure -f noninteractive unattended-upgrades || true

mkdir -p /opt/taskflow
if id -u "$TARGET_USER" >/dev/null 2>&1; then
  chown -R "$TARGET_USER":"$TARGET_USER" /opt/taskflow
fi

echo

cat <<EOF

Bootstrap complete.

Next:
  1. Open TCP 22, 80, and 443 in the Oracle VCN security list.
  2. Log out and back in so the docker group applies (or run: newgrp docker).
  3. Clone the repository if it is not already present:
       git clone https://github.com/aayusbhat26/task_flow.git /opt/taskflow
  4. Deploy:
       cd /opt/taskflow/deploy
       ./deploy.sh
  5. Watch TLS and health:
       cd /opt/taskflow/deploy
       docker compose --env-file .env -f docker-compose.prod.yml logs -f caddy web

DOMAIN can be <public-ip>.sslip.io (free, no account) or a free DuckDNS name.
EOF
