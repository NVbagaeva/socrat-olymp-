#!/bin/bash
# «Миграции»: свежие файлы миграций на сервер и bin/migrate.sh — новые
# миграции, список приглашённых (ALLOWED_EMAILS) и пароль роли туннеля
# (DB_ADMIN_PASSWORD). Значения идут по SSH на стандартный ввод и нигде
# не печатаются.
. "$(dirname "$0")/lib.sh"
ssh_setup
mask "${ALLOWED_EMAILS:-}"
mask "${DB_ADMIN_PASSWORD:-}"

sync_files
{
  printf 'ALLOWED_EMAILS=%s\n' "$(printf '%s' "${ALLOWED_EMAILS:-}" | tr -d '\n ')"
  printf 'DB_ADMIN_PASSWORD=%s\n' "${DB_ADMIN_PASSWORD:-}"
} | on_server "$REMOTE_DIR/bin/migrate.sh" | tee "$WORK/migrate.log"

summary <<MD
### Миграции

\`\`\`
$(cat "$WORK/migrate.log")
\`\`\`
MD
