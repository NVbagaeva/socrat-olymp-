#!/bin/bash
# Подготовка чистого сервера Ubuntu 24.04. Выполняется от root, один
# раз, кнопкой «Подготовить сервер» (actions/prepare.sh). Повторный
# запуск безопасен: каждый шаг проверяет, сделан ли он.
#
#   prepare.sh base     — пакеты, пользователи, swap, Docker, ufw,
#                         fail2ban, автообновления, журналы;
#   prepare.sh harden   — SSH только по ключу, вход root и по паролю
#                         выключены. Кнопка запускает его, только
#                         когда вход deploy по ключу уже проверен.
#
# Окружение для base:
#   DEPLOY_PUBKEY  — открытый ключ, с которым ходит GitHub Actions;
#   ADMIN_PUBKEY   — ваш открытый ключ для SSH-туннеля к базе (можно пусто).
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive
here=$(cd "$(dirname "$0")" && pwd)
phase=${1:?укажите base или harden}

log() { printf '%s %s\n' "$(date -u +%H:%M:%S)" "$*"; }

[ "$(id -u)" = 0 ] || { echo "Нужен root"; exit 1; }

base() {
  . /etc/os-release
  if [ "${VERSION_ID:-}" != "24.04" ]; then
    log "Внимание: ожидалась Ubuntu 24.04, здесь ${PRETTY_NAME:-неизвестно}"
  fi

  log "Пакеты"
  apt-get update -q
  apt-get install -y -q --no-install-recommends \
    ufw fail2ban unattended-upgrades apt-listchanges \
    rsync curl ca-certificates jq python3 age rclone openssl
  if command -v docker >/dev/null 2>&1; then
    log "Docker уже установлен: $(docker --version)"
  else
    # Docker из архива Ubuntu: зеркала в России доступны, отдельный
    # репозиторий download.docker.com не нужен.
    apt-get install -y -q docker.io docker-compose-v2
  fi
  docker compose version >/dev/null

  log "Пользователи deploy и tunnel"
  # deploy — для GitHub Actions: Docker и sudo без пароля, вход только
  # по ключу. Это права администратора, поэтому ключ живёт только в
  # GitHub Secrets (SERVER_SSH_KEY).
  id deploy >/dev/null 2>&1 || useradd --create-home --shell /bin/bash deploy
  usermod -aG docker deploy
  install -m 440 /dev/stdin /etc/sudoers.d/90-deploy <<<'deploy ALL=(ALL) NOPASSWD:ALL'
  visudo -cf /etc/sudoers.d/90-deploy >/dev/null
  install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
  printf '%s\n' "${DEPLOY_PUBKEY:?нет DEPLOY_PUBKEY}" > /home/deploy/.ssh/authorized_keys
  chown deploy:deploy /home/deploy/.ssh/authorized_keys
  chmod 600 /home/deploy/.ssh/authorized_keys

  # tunnel — только для SSH-туннеля к базе: без оболочки, без sudo и
  # Docker, ключ разрешает лишь проброс на 127.0.0.1:5432.
  id tunnel >/dev/null 2>&1 || useradd --create-home --shell /usr/sbin/nologin tunnel
  install -d -m 700 -o tunnel -g tunnel /home/tunnel/.ssh
  if [ -n "${ADMIN_PUBKEY:-}" ]; then
    printf 'restrict,port-forwarding,permitopen="127.0.0.1:5432",command="/bin/false" %s\n' "$ADMIN_PUBKEY" \
      > /home/tunnel/.ssh/authorized_keys
  else
    : > /home/tunnel/.ssh/authorized_keys
  fi
  chown tunnel:tunnel /home/tunnel/.ssh/authorized_keys
  chmod 600 /home/tunnel/.ssh/authorized_keys

  log "Каталог набора /opt/budetege-api"
  install -d -m 750 -o deploy -g deploy /opt/budetege-api

  log "Swap"
  if [ "$(swapon --noheadings | wc -l)" = "0" ]; then
    fallocate -l 1G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile >/dev/null
    swapon /swapfile
    grep -q '^/swapfile ' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  else
    log "swap уже есть"
  fi
  install -m 644 "$here/files/sysctl-budetege.conf" /etc/sysctl.d/90-budetege.conf
  sysctl --system >/dev/null

  log "Docker: журналы контейнеров и зеркало Docker Hub"
  mkdir -p /etc/docker
  current=/etc/docker/daemon.json
  [ -s "$current" ] || echo '{}' > "$current"
  jq -s '.[0] * .[1]' "$current" "$here/files/docker-daemon.json" > "$current.new"
  if ! cmp -s "$current" "$current.new"; then
    mv "$current.new" "$current"
    systemctl restart docker
  else
    rm -f "$current.new"
  fi
  systemctl enable --now docker >/dev/null

  log "Журналы системы: не больше 200 МБ"
  install -d /etc/systemd/journald.conf.d
  install -m 644 "$here/files/journald-budetege.conf" /etc/systemd/journald.conf.d/90-budetege.conf
  systemctl restart systemd-journald

  log "Автоматические обновления безопасности"
  install -m 644 "$here/files/apt-20auto-upgrades" /etc/apt/apt.conf.d/20auto-upgrades
  install -m 644 "$here/files/apt-52budetege" /etc/apt/apt.conf.d/52budetege
  systemctl enable --now unattended-upgrades >/dev/null

  log "fail2ban: SSH"
  install -m 644 "$here/files/fail2ban-sshd.local" /etc/fail2ban/jail.d/90-budetege.local
  systemctl enable fail2ban >/dev/null
  systemctl restart fail2ban

  log "ufw: открыты только 22, 80, 443"
  ufw --force reset >/dev/null
  ufw default deny incoming >/dev/null
  ufw default allow outgoing >/dev/null
  ufw allow 22/tcp >/dev/null
  ufw allow 80/tcp >/dev/null
  ufw allow 443/tcp >/dev/null
  ufw --force enable >/dev/null
  ufw status verbose | sed -n '1,12p'
}

harden() {
  log "SSH: только по ключу, без root и паролей"
  install -m 644 "$here/files/sshd-budetege.conf" /etc/ssh/sshd_config.d/10-budetege.conf
  sshd -t
  systemctl restart ssh 2>/dev/null || systemctl restart sshd
  # Пароль root больше не нужен ни для чего: блокируем.
  passwd -l root >/dev/null
  log "Готово: вход только deploy и tunnel по ключу"
}

case "$phase" in
  base) base ;;
  harden) harden ;;
  *) echo "Неизвестный шаг: $phase"; exit 1 ;;
esac
