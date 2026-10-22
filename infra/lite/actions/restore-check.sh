#!/bin/bash
# «Проверить восстановление».
#
# MODE=test (по умолчанию, и каждую неделю по расписанию): последняя
# копия из хранилища скачивается на машину GitHub, расшифровывается
# закрытым ключом BACKUP_AGE_IDENTITY и восстанавливается в чистый
# PostgreSQL 17 в контейнере. Число аккаунтов, профилей, комплектов и
# миграций сверяется с тем, что записал bin/backup.sh. Сервер не
# трогается. Копия старше MAX_AGE_HOURS (26 ч) — тоже сбой: значит,
# ночные копии перестали делаться.
#
# MODE=server и CONFIRM=ВОССТАНОВИТЬ: та же копия (или BACKUP_NAME)
# восстанавливается в базу на сервере (bin/restore.sh, перед этим —
# свежая копия текущей базы).
. "$(dirname "$0")/lib.sh"
mode=${MODE:-test}
mask "${S3_ACCESS_KEY_ID:-}"
mask "${S3_SECRET_ACCESS_KEY:-}"
: "${BACKUP_AGE_IDENTITY:?нет секрета BACKUP_AGE_IDENTITY}"
for tool in rclone age; do
  command -v "$tool" >/dev/null || sudo apt-get install -y -q "$tool" >/dev/null
done

# Хранилище — те же переменные, что на сервере (bin/lib.sh, s3_env).
export LITE_DIR=/nonexistent
# shellcheck source=../bin/lib.sh
. "$LITE_SRC/bin/lib.sh"
s3_env

umask 077
printf '%s\n' "$BACKUP_AGE_IDENTITY" > "$WORK/age_identity"
umask 022

if [ -n "${BACKUP_NAME:-}" ]; then
  name=${BACKUP_NAME%.dump.age}
  folder=$( (rclone lsf "$S3_ROOT/daily/" | grep -q "^$name.dump.age$" && echo daily) || echo weekly)
else
  folder=daily
  name=$(rclone lsf "$S3_ROOT/daily/" | grep '\.dump\.age$' | sort | tail -1 | sed 's/\.dump\.age$//')
fi
[ -n "$name" ] || { echo "В хранилище нет ни одной копии ($S3_ROOT/daily/)"; exit 1; }
log "Копия: $folder/$name"

rclone copyto "$S3_ROOT/$folder/$name.dump.age" "$WORK/$name.dump.age"
rclone copyto "$S3_ROOT/$folder/$name.json" "$WORK/$name.json"
age -d -i "$WORK/age_identity" -o "$WORK/$name.dump" "$WORK/$name.dump.age"
rm -f "$WORK/age_identity"

meta() { python3 -c 'import json,sys; d=json.load(open(sys.argv[1])); print(eval(sys.argv[2], {}, d))' "$WORK/$name.json" "$1"; }
created=$(meta created)
hours=$(( ($(date +%s) - $(date -d "$created" +%s)) / 3600 ))
log "Копия сделана $created ($hours ч назад), $(meta bytes) байт в шифре"
max=${MAX_AGE_HOURS:-26}
if [ "$mode" = "test" ] && [ "$max" != "0" ] && [ "$hours" -ge "$max" ]; then
  echo "Последней копии $hours ч — больше $max ч: ночные копии не делаются"
  stale=1
fi

expected=$(meta "f\"{counts['users']} {counts['profiles']} {counts['kits']} {counts['migrations']}\"")
count_sql="select (select count(*) from auth.users) || ' ' || (select count(*) from public.profiles) || ' ' || (select count(*) from public.kits) || ' ' || (select count(*) from lite.migrations)"

if [ "$mode" = "test" ]; then
  container=lite-restore-check
  docker rm -f "$container" >/dev/null 2>&1 || true
  log "Чистый PostgreSQL 17 и роли набора"
  docker run -d --name "$container" --memory 512m \
    -e POSTGRES_PASSWORD="$(openssl rand -hex 16)" \
    -e AUTHENTICATOR_PASSWORD="$(openssl rand -hex 16)" \
    -e AUTH_ADMIN_PASSWORD="$(openssl rand -hex 16)" \
    -v "$LITE_SRC/db/00-roles.sh:/docker-entrypoint-initdb.d/00-roles.sh:ro" \
    postgres:17-alpine >/dev/null
  trap 'docker rm -f "$container" >/dev/null 2>&1 || true; rm -f "$WORK"/db-*' EXIT
  for _ in $(seq 1 60); do
    # Готова — когда отработал init и сервер перезапустился.
    docker exec "$container" pg_isready -U postgres -h 127.0.0.1 >/dev/null 2>&1 \
      && docker exec "$container" psql -U postgres -tAc "select 1 from pg_roles where rolname = 'authenticator'" 2>/dev/null | grep -q 1 \
      && break
    sleep 2
  done
  log "pg_restore"
  docker exec -i "$container" pg_restore -U postgres -d postgres --exit-on-error < "$WORK/$name.dump"
  actual=$(docker exec "$container" psql -U postgres -d postgres -tAc "$count_sql")
else
  [ "${CONFIRM:-}" = "ВОССТАНОВИТЬ" ] || { echo "Для восстановления на сервер впишите в поле подтверждения слово ВОССТАНОВИТЬ"; exit 1; }
  ssh_setup
  trap 'rm -f "$WORK"/db-*' EXIT
  log "Восстановление на сервере"
  on_server "$REMOTE_DIR/bin/restore.sh" < "$WORK/$name.dump"
  actual=$(on_server "$REMOTE_DIR/bin/dc exec -T db psql -U postgres -d postgres -tAc \"$count_sql\"")
fi

read -r users profiles kits migrations <<<"$actual"
log "В копии: $expected; восстановлено: $actual (аккаунты профили комплекты миграции)"
summary <<MD
### Проверка восстановления ($mode)

| | аккаунты | профили | комплекты | миграции |
|---|---|---|---|---|
| записано в копии | $(echo "$expected" | tr ' ' '|' | sed 's/|/ | /g') |
| восстановлено | $users | $profiles | $kits | $migrations |

Копия **$folder/$name**, сделана $created ($hours ч назад).
MD

[ "$actual" = "$expected" ] || { echo "Восстановленная база не совпадает с копией"; exit 1; }
[ -z "${stale:-}" ] || exit 1
log "Восстановление проверено"
