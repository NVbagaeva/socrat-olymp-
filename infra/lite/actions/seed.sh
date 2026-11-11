#!/bin/bash
# «Тестовые данные»: «Тестовый класс» и тестовые ученики на адресах из
# секретов SEED_TUTOR_EMAIL и SEED_STUDENT_EMAILS (bin/seed.sh на
# сервере). Только по кнопке и только с подтверждением: в «Развернуть»
# и «Миграции» это не входит.
#
#   MODE=create (по умолчанию) — создать недостающее;
#   MODE=remove               — удалить тестовых учеников и класс.
#   CONFIRM=ТЕСТ              — подтверждение, без него отказ.
. "$(dirname "$0")/lib.sh"

if [ "${CONFIRM:-}" != "ТЕСТ" ]; then
  echo "Нужно подтверждение: впишите ТЕСТ в поле подтверждения."
  exit 1
fi
ssh_setup
mask "${SEED_TUTOR_EMAIL:-}"
while IFS= read -r address; do
  mask "$address"
done < <(printf '%s' "${SEED_STUDENT_EMAILS:-}" | tr ',' '\n' | tr -d ' ')

sync_files
arg=
[ "${MODE:-create}" = "remove" ] && arg=--remove
{
  printf 'SEED_TUTOR_EMAIL=%s\n' "$(printf '%s' "${SEED_TUTOR_EMAIL:-}" | tr -d '\n ')"
  printf 'SEED_STUDENT_EMAILS=%s\n' "$(printf '%s' "${SEED_STUDENT_EMAILS:-}" | tr -d '\n ')"
} | on_server "$REMOTE_DIR/bin/seed.sh" $arg | tee "$WORK/seed.log"

summary <<MD
### Тестовые данные

\`\`\`
$(cat "$WORK/seed.log")
\`\`\`
MD
