#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Relay Messenger — AWS Lightsail (Ubuntu 22.04 / 24.04) Automated Setup Script
# Usage:
#   sudo bash deploy-lightsail.sh [your-domain.com] [your-email@example.com]
# ==============================================================================

DOMAIN="${1:-}"
EMAIL="${2:-}"
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "==> [1/5] Ensuring 2GB swap space for MySQL on small Lightsail instances..."
if ! swapon --show | grep -q '/swapfile'; then
  fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo "==> [2/5] Installing Docker, Docker Compose, Nginx, and Certbot..."
apt-get update -y
apt-get install -y ca-certificates curl gnupg nginx certbot python3-certbot-nginx

if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
fi

echo "==> [3/5] Starting Relay & MySQL containers via Docker Compose..."
cd "$APP_DIR"
docker compose down -v 2>/dev/null || true
docker compose up -d

echo "==> [4/5] Configuring Nginx Reverse Proxy (HTTP + WebSockets)..."
SERVER_NAME="${DOMAIN:-_}"

cat >/etc/nginx/sites-available/relay <<EOF
map \$http_upgrade \$connection_upgrade {
    default upgrade;
    ''      close;
}

server {
    listen 80;
    listen [::]:80;
    server_name ${SERVER_NAME};

    client_max_body_size 32M;

    location / {
        proxy_pass http://127.0.0.1:6060;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection \$connection_upgrade;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
EOF

ln -sf /etc/nginx/sites-available/relay /etc/nginx/sites-enabled/relay
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

if [[ -n "$DOMAIN" && -n "$EMAIL" ]]; then
  echo "==> [5/5] Requesting Let's Encrypt HTTPS Certificate for ${DOMAIN}..."
  certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$EMAIL" --redirect
  echo "==> Relay is live at: https://${DOMAIN}"
else
  echo "==> [5/5] Skipping HTTPS (no domain/email passed)."
  echo "==> Relay is live on HTTP port 80 (and port 6060)."
  echo "    Wait ~20 seconds for MySQL & Relay DB initialization, then open your Static IP in a browser!"
fi
