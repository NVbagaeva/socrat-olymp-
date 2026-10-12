#!/bin/sh
# Поднять пробный набор и применить SQL пробного кабинета.
#
#   ALLOWED_EMAILS="a@example.test,b@example.test" ./up.sh
#
# Список адресов кладётся в vault.secrets (см. db/10-vault-shim.sql);
# в пробе это тестовые адреса из сценария, не настоящие.
set -eu
cd "$(dirname "$0")"

[ -f .env ] || node gen-env.mjs

docker compose --profile probe up -d --wait

psql_db() {
  docker compose exec -T db psql -U postgres -d postgres -v ON_ERROR_STOP=1 -q "$@"
}

# Таблицы, правила RLS, удаление аккаунта, хук регистрации — тот же
# файл, что применяется в облачном проекте, без правок.
if [ "$(psql_db -tAc "select to_regclass('public.profiles') is not null")" != "t" ]; then
  psql_db < ../../supabase/trial/auth_trial.sql
fi

psql_db -v emails="${ALLOWED_EMAILS:-}" <<'SQL'
insert into vault.secrets (name, secret) values ('allowed_emails', :'emails')
on conflict (name) do update set secret = excluded.secret, updated_at = now();
notify pgrst, 'reload schema';
SQL

echo "Набор поднят: API http://127.0.0.1:8000, письма http://127.0.0.1:8025"
