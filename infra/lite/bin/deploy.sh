#!/bin/sh
# Запуск и обновление набора на сервере. Его вызывает кнопка
# «Развернуть» после того, как скопировала файлы и .env.github.
#
# 1. Секреты сервера — один раз (bin/gen-env.sh).
# 2. Таймеры ночной копии и проверки здоровья (systemd).
# 3. Образы и контейнеры: docker compose pull и up --wait.
set -eu
. "$(dirname "$0")/lib.sh"
cd "$LITE_DIR"

mkdir -p "$STATE_DIR"
[ -f "$STATE_DIR/installed-at" ] || date -u +%s > "$STATE_DIR/installed-at"

"$LITE_DIR/bin/gen-env.sh"
load_env

if [ "${SKIP_TIMERS:-}" != "1" ]; then
  log "Таймеры: ночная копия и проверка здоровья"
  sudo install -m 644 "$LITE_DIR"/server/systemd/budetege-*.service "$LITE_DIR"/server/systemd/budetege-*.timer /etc/systemd/system/
  sudo systemctl daemon-reload
  sudo systemctl enable --now budetege-backup.timer budetege-health.timer
fi

# Docker Hub ограничивает число скачиваний с одного адреса; зеркало
# mirror.gcr.io (server/files/docker-daemon.json) помогает, но не всегда.
# Если скачать не вышло, а нужные версии уже есть на сервере, — идём
# дальше с ними.
log "Образы"
attempt=1
until dc pull --quiet; do
  if [ "$attempt" -ge 3 ]; then
    missing=0
    for image in $(dc config --images); do
      docker image inspect "$image" >/dev/null 2>&1 || { log "Нет образа $image"; missing=1; }
    done
    if [ "$missing" = 1 ]; then
      log "Образы не скачались за 3 попытки"
      exit 1
    fi
    log "Скачать не удалось, но все версии из compose.yml уже есть на сервере — запускаю с ними"
    break
  fi
  attempt=$((attempt + 1))
  sleep $((attempt * 15))
done

log "Контейнеры"
dc up -d --wait --wait-timeout 180 --remove-orphans
dc ps --format 'table {{.Service}}\t{{.Status}}'
docker image prune -f >/dev/null
