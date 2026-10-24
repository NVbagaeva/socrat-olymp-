#!/bin/sh
# Роль базы для сервиса загрузки фото (контейнер uploads, профиль chast2).
# Входит по паролю UPLOADS_DB_PASSWORD (.env.generated), сама прав не
# имеет: переключается в authenticated, чтобы права пользователя
# проверили функции базы, и в service_role, чтобы записать фото.
# Повторный запуск ничего не ломает.
set -eu
. "$(dirname "$0")/lib.sh"
load_env
cd "$LITE_DIR"

if [ -z "${UPLOADS_DB_PASSWORD:-}" ]; then
  umask 077
  printf "UPLOADS_DB_PASSWORD='%s'\n" "$(python3 -c 'import secrets; print(secrets.token_hex(24))')" >> .env.generated
  load_env
  log "Создан пароль UPLOADS_DB_PASSWORD (не печатается)"
fi

psql_db -v pass="$UPLOADS_DB_PASSWORD" <<'SQL'
select format('create role uploads login noinherit password %L', :'pass')
 where not exists (select 1 from pg_roles where rolname = 'uploads') \gexec
select format('alter role uploads password %L', :'pass') \gexec
grant authenticated, service_role to uploads;
SQL
log "Роль uploads готова"
