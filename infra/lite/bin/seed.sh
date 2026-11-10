#!/bin/bash
# Тестовые данные пробного режима: «Тестовый класс» и тестовые ученики
# у вашего аккаунта репетитора. Кнопка «Сервер: тестовые данные».
#
# В обычные «Развернуть» и «Миграции» не входит и сам никогда не
# запускается: только эта кнопка, только с подтверждением.
#
# Со стандартного ввода приходят строки KEY=value (из GitHub Secrets,
# не печатаются):
#   SEED_TUTOR_EMAIL     — почта уже зарегистрированного репетитора;
#   SEED_STUDENT_EMAILS  — адреса тестовых учеников через запятую
#                          (ваши адреса-алиасы), от одного до десяти.
# Все адреса должны быть в списке приглашённых (ALLOWED_EMAILS): тестовый
# ученик проходит ту же регистрацию, что и настоящий, с теми же
# согласиями — их за него отмечает этот скрипт, потому что адреса ваши.
#
#   seed.sh          создать недостающее; повторный запуск ничего не дублирует.
#                    Новым ученикам уходит письмо «Сброс пароля»: по ссылке
#                    из него вы задаёте пароль ученика;
#   seed.sh --remove удалить тестовых учеников и «Тестовый класс».
set -euo pipefail
. "$(dirname "$0")/lib.sh"
load_env
cd "$LITE_DIR"

CLASS_NAME='Тестовый класс'
mode=${1:-create}

SEED_TUTOR_EMAIL=
SEED_STUDENT_EMAILS=
while IFS= read -r line; do
  case "$line" in
    SEED_TUTOR_EMAIL=*) SEED_TUTOR_EMAIL=${line#SEED_TUTOR_EMAIL=} ;;
    SEED_STUDENT_EMAILS=*) SEED_STUDENT_EMAILS=${line#SEED_STUDENT_EMAILS=} ;;
  esac
done
tutor=$(printf '%s' "$SEED_TUTOR_EMAIL" | tr -d ' \n' | tr '[:upper:]' '[:lower:]')
mapfile -t students < <(printf '%s' "$SEED_STUDENT_EMAILS" | tr ',' '\n' | tr -d ' ' | tr '[:upper:]' '[:lower:]' | grep '@' | sort -u)

[ -n "$tutor" ] || { log "Нет секрета SEED_TUTOR_EMAIL — почты вашего аккаунта репетитора"; exit 1; }
[ "${#students[@]}" -ge 1 ] && [ "${#students[@]}" -le 10 ] \
  || { log "В SEED_STUDENT_EMAILS должно быть от одного до десяти адресов через запятую"; exit 1; }
for email in "${students[@]}"; do
  [ "$email" != "$tutor" ] || { log "Адрес репетитора не может быть и адресом ученика"; exit 1; }
done

sql() { psql_db -tA "$@"; }
api() {
  curl --silent --show-error --max-time 20 --insecure --resolve "$API_DOMAIN:443:127.0.0.1" "$@"
}

tutor_id=$(sql -v email="$tutor" <<'SQL'
select u.id from auth.users u join public.profiles p on p.user_id = u.id
where lower(u.email) = :'email' and p.role = 'tutor';
SQL
)
[ -n "$tutor_id" ] || { log "Аккаунта репетитора с почтой из SEED_TUTOR_EMAIL нет. Сначала зарегистрируйтесь на сайте как репетитор и подтвердите почту."; exit 1; }

if [ "$mode" = "--remove" ]; then
  removed=0
  for email in "${students[@]}"; do
    n=$(sql -v email="$email" <<'SQL'
with marked as (
  -- Журнал согласий остаётся с отметкой об удалении — как при
  -- «Удалить аккаунт» в кабинете.
  update public.consents c set account_deleted_at = now()
  from auth.users u join public.profiles p on p.user_id = u.id
  where c.user_id = u.id and c.account_deleted_at is null
    and p.role = 'student' and lower(u.email) = :'email'
), gone as (
  delete from auth.users u using public.profiles p
  where p.user_id = u.id and p.role = 'student' and lower(u.email) = :'email'
  returning 1)
select count(*) from gone;
SQL
)
    removed=$((removed + n))
  done
  sql -v tutor="$tutor_id" -v name="$CLASS_NAME" <<'SQL' >/dev/null
delete from public.classes where tutor_id = :'tutor' and name = :'name';
SQL
  log "Удалено тестовых учеников: $removed; «$CLASS_NAME» удалён"
  exit 0
fi

version=$(sql -c 'select public.current_documents_version()')
[ -n "$version" ] || { log "В базе нет редакции документов — сначала «Сервер: миграции»"; exit 1; }

created=0
number=0
fresh=()
for email in "${students[@]}"; do
  number=$((number + 1))
  if [ "$(sql -v email="$email" <<'SQL'
select public.email_allowed(:'email');
SQL
)" != "t" ]; then
    log "Ученик $number: адреса нет в списке приглашённых (ALLOWED_EMAILS). Добавьте его и нажмите «Миграции»."
    exit 1
  fi
  exists=$(sql -v email="$email" <<'SQL'
select count(*) from auth.users where lower(email) = :'email';
SQL
)
  if [ "$exists" = "0" ]; then
    body=$(python3 -c '
import json, secrets, sys
email, number, version = sys.argv[1:4]
print(json.dumps({
    "email": email,
    "password": secrets.token_urlsafe(24),
    "email_confirm": True,
    "user_metadata": {
        "name": f"Тестовый ученик {number}", "role": "student", "birth_year": 2000,
        "documents_version": version, "accept_soglashenie": True, "accept_soglasie": True,
        "seed": True,
    },
}))' "$email" "$number" "$version")
    code=$(printf '%s' "$body" | api -o /dev/null -w '%{http_code}' -X POST \
      -H "apikey: $SERVICE_ROLE_KEY" -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
      -H 'Content-Type: application/json' --data-binary @- "https://$API_DOMAIN/auth/v1/admin/users")
    [ "$code" = "200" ] || { log "Ученик $number: служба входа ответила $code — аккаунт не создан"; exit 1; }
    created=$((created + 1))
    fresh+=("$email")
  fi
  role=$(sql -v email="$email" <<'SQL'
select p.role from auth.users u join public.profiles p on p.user_id = u.id where lower(u.email) = :'email';
SQL
)
  [ "$role" = "student" ] || { log "Ученик $number: аккаунт с этим адресом уже есть, но он не ученик"; exit 1; }
done

list=$(printf '%s,' "${students[@]}")
sql -v tutor="$tutor_id" -v name="$CLASS_NAME" -v emails="${list%,}" <<'SQL' >/dev/null
begin;
insert into public.tutor_students (tutor_id, user_id)
select :'tutor', u.id from auth.users u where lower(u.email) = any (string_to_array(:'emails', ','))
on conflict (tutor_id, user_id) do update set ended_at = null;
insert into public.classes (tutor_id, name)
select :'tutor', :'name'
where not exists (select 1 from public.classes where tutor_id = :'tutor' and name = :'name' and archived_at is null);
insert into public.class_members (class_id, user_id)
select c.id, u.id
from public.classes c, auth.users u
where c.tutor_id = :'tutor' and c.name = :'name' and c.archived_at is null
  and lower(u.email) = any (string_to_array(:'emails', ','))
on conflict do nothing;
commit;
SQL

# Новым ученикам — письмо «Сброс пароля»: пароль задаёте вы по ссылке.
# Служба входа шлёт одному адресу не чаще раза в минуту; адреса разные.
mailed=0
for email in "${fresh[@]}"; do
  code=$(python3 -c 'import json, sys; print(json.dumps({"email": sys.argv[1]}))' "$email" \
    | api -o /dev/null -w '%{http_code}' -X POST -H "apikey: $ANON_KEY" -H 'Content-Type: application/json' \
      --data-binary @- "https://$API_DOMAIN/auth/v1/recover?redirect_to=$SITE_ORIGIN/voyti/novyy-parol/")
  [ "$code" = "200" ] && mailed=$((mailed + 1)) || log "Письмо «Сброс пароля» не ушло (ответ $code) — запросите его на сайте: «Забыли пароль?»"
done

in_class=$(sql -v tutor="$tutor_id" -v name="$CLASS_NAME" <<'SQL'
select count(*) from public.class_members m join public.classes c on c.id = m.class_id
where c.tutor_id = :'tutor' and c.name = :'name' and c.archived_at is null;
SQL
)
log "«$CLASS_NAME»: учеников $in_class; создано аккаунтов $created, писем «Сброс пароля» отправлено $mailed"
