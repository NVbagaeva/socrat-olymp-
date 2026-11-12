#!/bin/sh
# Миграции базы и список приглашённых. Кнопка «Миграции».
#
# Файлы migrations/NNN-*.sql (их кладёт «Развернуть» по списку
# infra/lite/migrations.txt) применяются по порядку, каждый в одной
# транзакции. Применённые записываются в lite.migrations с хешем:
# повторный запуск их пропускает, а изменённый задним числом файл
# останавливает миграции — правка уже применённого SQL идёт новым файлом.
#
# После миграций — каталог банка (catalog/*.sql): он пересобирается
# вместе с банком и применяется каждый раз, повтор безопасен.
#
# Со стандартного ввода приходят строки KEY=value (из GitHub Secrets,
# не печатаются):
#   ALLOWED_EMAILS     — адреса через запятую, кому открыта регистрация;
#   DOCUMENTS_VERSION  — дата редакции правовых документов, ГГГГ-ММ-ДД
#                        (из app/src/content/legal/operator.json): без
#                        неё регистрация закрыта, с новой датой люди
#                        заново отмечают галочки согласий;
#   SIGNUP_EXTRA       — школьная и рабочая почта, добавленная вручную:
#                        домены (school.ru) и отдельные адреса через
#                        запятую; остальным регистрация — только с почтой
#                        российских сервисов (необязательно);
#   ADMIN_EMAIL        — почта аккаунта администратора (необязательно);
#   DB_ADMIN_PASSWORD  — пароль роли budetege_admin для доступа к базе
#                        через SSH-туннель (необязательно).
set -eu
. "$(dirname "$0")/lib.sh"
load_env
cd "$LITE_DIR"

ALLOWED_EMAILS=
SIGNUP_EXTRA=
DOCUMENTS_VERSION=
ADMIN_EMAIL=
DB_ADMIN_PASSWORD=
while IFS= read -r line; do
  case "$line" in
    ALLOWED_EMAILS=*) ALLOWED_EMAILS=${line#ALLOWED_EMAILS=} ;;
    SIGNUP_EXTRA=*) SIGNUP_EXTRA=${line#SIGNUP_EXTRA=} ;;
    DOCUMENTS_VERSION=*) DOCUMENTS_VERSION=${line#DOCUMENTS_VERSION=} ;;
    ADMIN_EMAIL=*) ADMIN_EMAIL=${line#ADMIN_EMAIL=} ;;
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

# Каталог банка: номера заданий и прототипы, на которые ссылаются ДЗ,
# попытки и тренировки.
for file in catalog/*.sql; do
  [ -e "$file" ] || continue
  psql_db < "$file"
  log "Каталог банка обновлён: $(basename "$file")"
done

# Редакция правовых документов. Регистрация сверяет с ней дату, которую
# человек видел на сайте; новая дата — новая строка, старые остаются.
case "$DOCUMENTS_VERSION" in
  [0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9])
    psql_db -v version="$DOCUMENTS_VERSION" <<'SQL'
insert into public.legal_editions (version) values (:'version') on conflict (version) do nothing;
SQL
    log "Редакция документов: $(psql_db -tAc 'select public.current_documents_version()')"
    ;;
  '') log "Редакция документов не передана — в базе $(psql_db -tAc "select coalesce(public.current_documents_version()::text, 'ни одной: регистрация закрыта')")" ;;
  *) log "DOCUMENTS_VERSION должна быть датой ГГГГ-ММ-ДД"; exit 1 ;;
esac

# Список приглашённых: витрина vault.decrypted_secrets (db/10-vault-shim.sql),
# её читает хук регистрации. Пустой список — регистрация закрыта для всех.
psql_db -v emails="$ALLOWED_EMAILS" <<'SQL'
insert into vault.secrets (name, secret) values ('allowed_emails', :'emails')
on conflict (name) do update set secret = excluded.secret, updated_at = now();
SQL
count=$(printf '%s' "$ALLOWED_EMAILS" | tr ',' '\n' | grep -c '@' || true)
log "Список приглашённых обновлён: адресов $count"

# Почта, добавленная вручную (миграция 20261113120000_pochtovye_domeny.sql):
# таблица переписывается целиком, одной транзакцией. Значение с ошибкой —
# таблица остаётся прежней, кнопка останавливается с подсказкой.
if ! psql_db -v extra="$SIGNUP_EXTRA" <<'SQL'
begin;
delete from auth_hooks.signup_extra;
insert into auth_hooks.signup_extra (value, kind)
select v, case when position('@' in v) > 0 then 'email' else 'domain' end
  from (select distinct ltrim(lower(trim(item)), '@') as v
          from unnest(string_to_array(:'extra', ',')) as item) as q
 where v <> '';
commit;
SQL
then
  log "SIGNUP_EXTRA: не получилось записать. Нужны домены (school.ru) и адреса (name@school.ru) через запятую, без пробелов внутри."
  exit 1
fi
log "Почта, добавленная вручную: $(psql_db -tAc "select 'доменов ' || count(*) filter (where kind = 'domain') || ', адресов ' || count(*) filter (where kind = 'email') from auth_hooks.signup_extra")"

# Администратор — один на базу, назначается только здесь. Аккаунт должен
# быть уже зарегистрирован; нет его — подскажем и пойдём дальше.
if [ -n "$ADMIN_EMAIL" ]; then
  if [ "$(psql_db -tA -v email="$ADMIN_EMAIL" <<'SQL'
select count(*) from auth.users where lower(email) = lower(trim(:'email'));
SQL
)" = "1" ]; then
    psql_db -v email="$ADMIN_EMAIL" <<'SQL' >/dev/null
select public.grant_admin(:'email');
SQL
    log "Администратор назначен"
  else
    log "Администратор не назначен: аккаунта с почтой из ADMIN_EMAIL ещё нет. Зарегистрируйте его и нажмите «Миграции» ещё раз."
  fi
fi

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
