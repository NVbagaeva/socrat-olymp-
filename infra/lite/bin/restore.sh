#!/bin/bash
# Восстановление базы на сервере из копии. Только кнопкой «Проверить
# восстановление» в режиме server и со словом-подтверждением: она
# скачивает копию из хранилища, расшифровывает её на машине GitHub и
# передаёт сюда, на стандартный ввод, в формате pg_dump -Fc.
#
# Перед восстановлением делается свежая копия (bin/backup.sh), чтобы
# можно было вернуться. На время восстановления служба входа и PostgREST
# остановлены: сайт показывает «Нет связи с сервисом входа».
set -euo pipefail
. "$(dirname "$0")/lib.sh"
load_env
cd "$LITE_DIR"

incoming="$STATE_DIR/tmp/restore.dump"
mkdir -p "$STATE_DIR/tmp"
trap 'rm -f "$incoming"' EXIT
cat > "$incoming"
[ -s "$incoming" ] || { log "Пустая копия — восстанавливать нечего"; exit 1; }

if [ "${SKIP_BACKUP:-}" != "1" ]; then
  log "Сначала — свежая копия текущей базы"
  "$LITE_DIR/bin/backup.sh"
fi

log "Останавливаю службу входа и PostgREST"
dc stop auth rest

restore() {
  dc exec -T db psql -U postgres -d postgres -q -c \
    "select pg_terminate_backend(pid) from pg_stat_activity where datname = 'postgres' and pid <> pg_backend_pid()" >/dev/null
  dc exec -T db pg_restore -U postgres -d postgres --clean --if-exists --single-transaction --exit-on-error < "$incoming"
}

if restore; then
  log "База восстановлена"
  status=0
else
  log "Восстановление не прошло — транзакция отменена, база осталась как была"
  status=1
fi

log "Запускаю службу входа и PostgREST"
dc up -d --wait auth rest
psql_db -c "notify pgrst, 'reload schema'"
exit "$status"
