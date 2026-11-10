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

# Права по умолчанию (db/01-schemas.sql) дают ролям запросов все права
# на каждую новую таблицу и функцию схемы public; лишнее потом снимают
# миграции. pg_restore пересоздаёт таблицы и функции заново, и если
# права по умолчанию в этот момент действуют, новые объекты получают их
# целиком — а из копии приходят только выданные права, но не снятые.
# Так аноним получил бы право вызывать служебные функции. Поэтому на
# время восстановления права по умолчанию снимаются: объекты получают
# ровно те права, что записаны в копии. После — возвращаются, при любом
# исходе.
default_privileges() {
  psql_db <<SQL
alter default privileges in schema public $1 all on tables $2 anon, authenticated, service_role;
alter default privileges in schema public $1 all on sequences $2 anon, authenticated, service_role;
alter default privileges in schema public $1 all on functions $2 anon, authenticated, service_role;
SQL
}

restore() {
  dc exec -T db psql -U postgres -d postgres -q -c \
    "select pg_terminate_backend(pid) from pg_stat_activity where datname = 'postgres' and pid <> pg_backend_pid()" >/dev/null
  default_privileges revoke from
  dc exec -T db pg_restore -U postgres -d postgres --clean --if-exists --single-transaction --exit-on-error < "$incoming"
}

if restore; then
  log "База восстановлена"
  status=0
else
  log "Восстановление не прошло — транзакция отменена, база осталась как была"
  status=1
fi
default_privileges grant to

# Сверка: после восстановления анониму не должно быть доступно ничего,
# кроме справочников, и ни одной функции. Если это не так, копия была
# снята с базы с лишними правами или восстановление их вернуло —
# служба входа и PostgREST не запускаются.
if [ "$status" = 0 ]; then
  leaked=$(psql_db -tA <<'SQL'
select count(*) from (
  select 1 from pg_proc p
   where p.pronamespace = 'public'::regnamespace and p.prokind = 'f'
     and has_function_privilege('anon', p.oid, 'execute')
  union all
  select 1 from pg_class c
   where c.relnamespace = 'public'::regnamespace and c.relkind in ('r', 'v', 'p')
     and c.relname not in ('ege_tasks', 'bank_prototypes', 'legal_editions')
     and has_table_privilege('anon', c.oid, 'select, insert, update, delete')
) q;
SQL
)
  if [ "$leaked" != "0" ]; then
    log "После восстановления у анонима лишние права на $leaked объектов схемы public. Служба входа и PostgREST остановлены — напишите разработчику."
    exit 1
  fi
  log "Права сверены: анониму открыты только справочники"
fi

log "Запускаю службу входа и PostgREST"
dc up -d --wait auth rest
psql_db -c "notify pgrst, 'reload schema'"
exit "$status"
