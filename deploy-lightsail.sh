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

echo "==> [1/4] Installing Docker, Docker Compose, Nginx, and Certbot..."
apt-get update -y
apt-get install -y ca-certificates curl gnupg nginx certbot python3-certbot-nginx

if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
fi

echo "==> [2/4] Starting Relay & MySQL containers via Docker Compose..."
cd "$APP_DIR"
docker compose up -d

echo "==> [3/4] Configuring Nginx Reverse Proxy (HTTP + WebSockets)..."
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
  echo "==> [4/4] Requesting Let's Encrypt HTTPS Certificate for ${DOMAIN}..."
  certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$EMAIL" --redirect
  echo "==> Relay is live at: https://${DOMAIN}"
else
  echo "==> [4/4] Skipping HTTPS (no domain/email passed)."
  echo "==> Relay is live on HTTP port 80 (and port 6060)."
  echo "    To enable HTTPS later for PWA & WebRTC calls, run:"
  echo "    sudo certbot --nginx -d your-domain.com"
fi
