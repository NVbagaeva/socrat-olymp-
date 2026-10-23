#!/bin/bash
# «Обновить»: пакеты Ubuntu (все, не только безопасности) и образы
# набора по версиям из compose.yml. Перезагрузка — только если её
# просит система и в запуске отмечено REBOOT=1.
. "$(dirname "$0")/lib.sh"
ssh_setup
sync_files

log "Пакеты Ubuntu"
on_server 'sudo apt-get update -q && sudo DEBIAN_FRONTEND=noninteractive apt-get -y -q \
  -o Dpkg::Options::=--force-confdef -o Dpkg::Options::=--force-confold upgrade' | tail -5

log "Образы и контейнеры"
on_server "$REMOTE_DIR/bin/deploy.sh"

if on_server 'test -f /var/run/reboot-required'; then
  if [ "${REBOOT:-}" = "1" ]; then
    log "Перезагрузка"
    on_server 'sudo systemctl reboot' || true
    sleep 30
    for _ in $(seq 1 30); do
      on_server true 2>/dev/null && break
      sleep 10
    done
    on_server "$REMOTE_DIR/bin/dc up -d --wait --wait-timeout 180"
    rebooted="перезагружен"
  else
    rebooted="просит перезагрузку — запустите «Обновить» с отметкой «перезагрузить»"
  fi
else
  rebooted="перезагрузка не нужна"
fi

summary <<MD
### Сервер обновлён

Пакеты и образы обновлены; сервер: $rebooted.
MD
