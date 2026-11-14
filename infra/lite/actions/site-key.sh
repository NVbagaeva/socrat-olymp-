#!/bin/bash
# «Ключ для сайта»: адрес API и публичный ключ anon — в Variables
# репозитория, откуда их берёт сборка сайта (deploy.yml):
#   NEXT_PUBLIC_SUPABASE_URL       = https://<API_DOMAIN>
#   NEXT_PUBLIC_SUPABASE_ANON_KEY  = ключ anon с сервера
#
# Ключ создаётся на сервере (bin/gen-env.sh) и идёт оттуда прямо в
# настройки GitHub: его не нужно копировать руками, и в журнале запуска
# он закрыт маской. Сам по себе ключ публичный — его увидит любой
# браузер, открывший сайт; доступ к строкам решают правила базы.
# Секретный ключ service_role с сервера не уходит никуда: скрипт сверяет
# роль внутри ключа и отказывается записывать что-либо, кроме anon.
#
# Флаг NEXT_PUBLIC_AUTH_ENABLED эта кнопка не трогает: включить вход на
# сайте — отдельное решение.
#
# Нужен токен GH_TOKEN с правом Variables: Read and write (тот же
# GH_SECRETS_TOKEN, см. docs/SERVER.md). В CI вместо записи в GitHub —
# файлы в папке SITE_KEY_OUT.
. "$(dirname "$0")/lib.sh"
ssh_setup
: "${API_DOMAIN:?нет переменной API_DOMAIN}"

key=$(on_server "$REMOTE_DIR/bin/gen-env.sh --print-anon" | tr -d '\r\n ')
mask "$key"
[ -n "$key" ] || { echo "Сервер не отдал ключ — сначала «Сервер: развернуть»"; exit 1; }

role=$(python3 -c '
import base64, json, sys
parts = sys.argv[1].split(".")
if len(parts) != 3:
    sys.exit(1)
payload = parts[1] + "=" * (-len(parts[1]) % 4)
print(json.loads(base64.urlsafe_b64decode(payload)).get("role", ""))
' "$key" 2>/dev/null || true)
if [ "$role" != "anon" ]; then
  echo "Сервер отдал не ключ anon — ничего не записано."
  exit 1
fi

url="https://$API_DOMAIN"
if [ -n "${SITE_KEY_OUT:-}" ]; then
  mkdir -p "$SITE_KEY_OUT"
  printf '%s' "$url" > "$SITE_KEY_OUT/NEXT_PUBLIC_SUPABASE_URL"
  printf '%s' "$key" > "$SITE_KEY_OUT/NEXT_PUBLIC_SUPABASE_ANON_KEY"
else
  : "${GH_TOKEN:?нет секрета GH_SECRETS_TOKEN — токен с правом Variables: Read and write}"
  gh variable set NEXT_PUBLIC_SUPABASE_URL --repo "$GITHUB_REPOSITORY" --body "$url"
  printf '%s' "$key" | gh variable set NEXT_PUBLIC_SUPABASE_ANON_KEY --repo "$GITHUB_REPOSITORY"
fi
log "Записаны NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY"

summary <<MD
### Ключ для сайта

- \`NEXT_PUBLIC_SUPABASE_URL\` = \`$url\`
- \`NEXT_PUBLIC_SUPABASE_ANON_KEY\` — записан, значение скрыто (${#key} знаков, роль внутри ключа — anon)

Вход на сайте этим не включается. Когда будете готовы: Variable
\`NEXT_PUBLIC_AUTH_ENABLED\` = \`1\`, затем **Actions → Deploy → Run workflow**.
MD
