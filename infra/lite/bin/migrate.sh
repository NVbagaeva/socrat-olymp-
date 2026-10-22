#!/bin/sh
# Миграции базы и список приглашённых. Кнопка «Миграции».
#
# Файлы migrations/NNN-*.sql (их кладёт «Развернуть» по списку
# infra/lite/migrations.txt) применяются по порядку, каждый в одной
# транзакции. Применённые записываются в lite.migrations с хешем:
# повторный запуск их пропускает, а изменённый задним числом файл
# останавливает миграции — правка уже применённого SQL идёт новым файлом.
#
# Со стандартного ввода приходят строки KEY=value (из GitHub Secrets,
# не печатаются):
#   ALLOWED_EMAILS     — адреса через запятую, кому открыта регистрация;
#   DB_ADMIN_PASSWORD  — пароль роли budetege_admin для доступа к базе
#                        через SSH-туннель (необязательно).
set -eu
. "$(dirname "$0")/lib.sh"
load_env
cd "$LITE_DIR"

ALLOWED_EMAILS=
DB_ADMIN_PASSWORD=
while IFS= read -r line; do
  case "$line" in
    ALLOWED_EMAILS=*) ALLOWED_EMAILS=${line#ALLOWED_EMAILS=} ;;
    DB_ADMIN_PASSWORD=*) DB_ADMIN_PASSWORD=${line#DB_ADMIN_PASSWORD=} ;;
  esac
done

applied=0
for file in migrations/*.sql; do
  [ -e "$file" ] || continue
  name=$(basename "$file")
  sum=$(sha256sum "$file" | cut -d' ' -f1)
  known=$(psql_db -tA -v name="$name" <<'SQL'
select sha256 from lite.migrations where name = :'name';
SQL
)
  if [ "$known" = "$sum" ]; then
    continue
  fi
  if [ -n "$known" ]; then
    log "Миграция $name уже применена, но файл изменился. Правку нужно оформить новым файлом."
    exit 1
  fi
  log "Применяю $name"
  {
    printf 'begin;\n'
    cat "$file"
    printf "\ninsert into lite.migrations (name, sha256) values ('%s', '%s');\ncommit;\n" "$name" "$sum"
  } | psql_db
  applied=$((applied + 1))
done
log "Новых миграций: $applied"

# Список приглашённых: витрина vault.decrypted_secrets (db/10-vault-shim.sql),
# её читает хук регистрации. Пустой список — регистрация закрыта для всех.
psql_db -v emails="$ALLOWED_EMAILS" <<'SQL'
insert into vault.secrets (name, secret) values ('allowed_emails', :'emails')
on conflict (name) do update set secret = excluded.secret, updated_at = now();
SQL
count=$(printf '%s' "$ALLOWED_EMAILS" | tr ',' '\n' | grep -c '@' || true)
log "Список приглашённых обновлён: адресов $count"

# Роль для просмотра и правки данных через SSH-туннель: читает и пишет
# все таблицы, видит строки всех пользователей (bypassrls), но не
# суперпользователь и не меняет схему служебных ролей.
if [ -n "$DB_ADMIN_PASSWORD" ]; then
  psql_db -v pass="$DB_ADMIN_PASSWORD" <<'SQL'
select 'create role budetege_admin login bypassrls'
where not exists (select from pg_roles where rolname = 'budetege_admin') \gexec
alter role budetege_admin with login bypassrls password :'pass';
grant pg_read_all_data, pg_write_all_data to budetege_admin;
SQL
  log "Роль budetege_admin для туннеля обновлена"
fi

psql_db -c "notify pgrst, 'reload schema'"
