#!/bin/bash
# Ночная копия базы: pg_dump → шифрование age → Yandex Object Storage.
#
#   daily/   — каждая копия, хранятся 14 последних дней;
#   weekly/  — одна в неделю, хранятся 8 недель.
#
# Копия шифруется открытым ключом (BACKUP_AGE_RECIPIENT). Закрытый ключ
# лежит только в GitHub Secrets (BACKUP_AGE_IDENTITY): с сервера старые
# копии не прочитать, даже если его взломают. Рядом с копией кладётся
# db-….json — сколько в ней аккаунтов, профилей и комплектов; по нему
# «Проверить восстановление» сверяет восстановленную базу.
#
# Запускает таймер budetege-backup.timer каждую ночь и кнопка «Копия
# сейчас». Не получилось — письмо владельцу (bin/mail.sh).
set -euo pipefail
. "$(dirname "$0")/lib.sh"
load_env
cd "$LITE_DIR"
mkdir -p "$STATE_DIR/tmp"

exec 9>"$STATE_DIR/backup.lock"
if ! flock -n 9; then
  log "Копия уже делается — второй раз не запускаю"
  exit 0
fi

fail() {
  local code=$?
  log "Копия не сделана (код $code)"
  printf 'Ночная копия базы не сделана: %s.\nСмотрите журнал: journalctl -u budetege-backup или запуск кнопки «Копия сейчас».\n' \
    "${step:-неизвестный шаг}" | "$LITE_DIR/bin/mail.sh" "Копия не сделана" || true
  rm -f "$STATE_DIR"/tmp/db-*
  exit "$code"
}
trap fail ERR

: "${BACKUP_AGE_RECIPIENT:?нет BACKUP_AGE_RECIPIENT}"
s3_env

stamp=$(date -u +%Y%m%dT%H%M%SZ)
name="db-$stamp"
dump="$STATE_DIR/tmp/$name.dump.age"
meta="$STATE_DIR/tmp/$name.json"

step="pg_dump"
log "pg_dump и шифрование"
dc exec -T db pg_dump -U postgres -d postgres -Fc --no-password | age -r "$BACKUP_AGE_RECIPIENT" -o "$dump"

step="подсчёт строк"
counts=$(psql_db -tA <<'SQL'
select json_build_object(
  'users', (select count(*) from auth.users),
  'profiles', (select count(*) from public.profiles),
  'kits', (select count(*) from public.kits),
  'migrations', (select count(*) from lite.migrations)
);
SQL
)
size=$(stat -c %s "$dump")
printf '{"name":"%s","created":"%s","bytes":%s,"counts":%s}\n' \
  "$name" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$size" "$counts" > "$meta"

step="загрузка в хранилище"
log "Загрузка: $name ($size байт)"
rclone copyto --s3-no-check-bucket "$dump" "$S3_ROOT/daily/$name.dump.age"
rclone copyto "$meta" "$S3_ROOT/daily/$name.json"

step="проверка загрузки"
remote_size=$(rclone lsjson "$S3_ROOT/daily/$name.dump.age" | python3 -c 'import json,sys; print(json.load(sys.stdin)[0]["Size"])')
[ "$remote_size" = "$size" ]

# Недельная — если за последние 6 дней её не было.
step="недельная копия"
if [ "$(rclone lsf --max-age 6d "$S3_ROOT/weekly/" 2>/dev/null | grep -c '\.dump\.age$' || true)" = "0" ]; then
  log "Недельная копия"
  rclone copyto "$dump" "$S3_ROOT/weekly/$name.dump.age"
  rclone copyto "$meta" "$S3_ROOT/weekly/$name.json"
fi

step="удаление старых копий"
rclone delete --min-age 14d "$S3_ROOT/daily/"
rclone delete --min-age 56d "$S3_ROOT/weekly/"

rm -f "$dump" "$meta"
printf '%s %s\n' "$(date -u +%s)" "$name" > "$STATE_DIR/last-backup"
trap - ERR
log "Копия готова: $name"
