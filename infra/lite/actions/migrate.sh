#!/bin/bash
# «Миграции»: свежие файлы миграций на сервер и bin/migrate.sh — новые
# миграции, каталог банка, список приглашённых (ALLOWED_EMAILS), редакция
# правовых документов (из app/src/content/legal/operator.json),
# администратор (ADMIN_EMAIL) и пароль роли туннеля (DB_ADMIN_PASSWORD).
# Значения идут по SSH на стандартный ввод и нигде не печатаются.
. "$(dirname "$0")/lib.sh"
ssh_setup
mask "${ALLOWED_EMAILS:-}"
mask "${ADMIN_EMAIL:-}"
mask "${DB_ADMIN_PASSWORD:-}"

# Дата редакции документов: ДД.ММ.ГГГГ в operator.json → ГГГГ-ММ-ДД,
# как её считает сайт (app/src/lib/legal/operator.ts). Не заполнена —
# пусто: редакция в базе не меняется.
documents_version=${DOCUMENTS_VERSION:-}
if [ -z "$documents_version" ]; then
  documents_version=$(python3 -c '
import json, re, sys
data = json.load(open(sys.argv[1], encoding="utf8")).get("data", "").strip()
match = re.fullmatch(r"(\d{2})\.(\d{2})\.(\d{4})", data)
print(f"{match[3]}-{match[2]}-{match[1]}" if match else "")
' "$REPO_ROOT/app/src/content/legal/operator.json")
fi

sync_files
{
  printf 'ALLOWED_EMAILS=%s\n' "$(printf '%s' "${ALLOWED_EMAILS:-}" | tr -d '\n ')"
  printf 'DOCUMENTS_VERSION=%s\n' "$documents_version"
  printf 'ADMIN_EMAIL=%s\n' "$(printf '%s' "${ADMIN_EMAIL:-}" | tr -d '\n ')"
  printf 'DB_ADMIN_PASSWORD=%s\n' "${DB_ADMIN_PASSWORD:-}"
} | on_server "$REMOTE_DIR/bin/migrate.sh" | tee "$WORK/migrate.log"

summary <<MD
### Миграции

\`\`\`
$(cat "$WORK/migrate.log")
\`\`\`
MD
