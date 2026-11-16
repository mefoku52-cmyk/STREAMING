#!/bin/bash
# Firewall pravidlá pre CMEP Streaming VPS (ufw).
# Spustiť ako root po nasadení: bash deploy/firewall/ufw-rules.sh
set -euo pipefail

echo "==> Reset ufw (opatrne: toto odstráni existujúce pravidlá)"
ufw --force reset

echo "==> Predvolené: odíť všetko prichádzajúce, povoliť odchádzajúce"
ufw default deny incoming
ufw default allow outgoing

echo "==> SSH (zachovať prístup k VPS)"
ufw allow 22/tcp comment 'SSH'

echo "==> HTTPS/WSS pre Caddy (signaling, static, healthz)"
ufw allow 443/tcp comment 'HTTPS/WSS (Caddy reverse proxy)'

echo "==> HTTP pre Caddy ACME challenges (voliteľné, ak Caddy nie je na 80)"
ufw allow 80/tcp comment 'HTTP (ACME challenge)'

echo "==> Mediasoup RTP/RTCP — UDP+TCP (verejný WebRTC media prenos)"
ufw allow 60000:60100/udp comment 'Mediasoup RTP/RTCP (UDP)'
ufw allow 60000:60100/tcp comment 'Mediasoup RTP/RTCP (TCP fallback)'

echo "==> coturn TURN server"
ufw allow 3478/udp comment 'TURN control (UDP)'
ufw allow 3478/tcp comment 'TURN control (TCP)'
ufw allow 5349/tcp comment 'TURN/TLS'
ufw allow 49152:65535/udp comment 'coturn relay media (UDP)'
ufw allow 49152:65535/tcp comment 'coturn relay media (TCP)'

echo "==> Povoliť a overiť"
ufw --force enable
ufw status numbered
