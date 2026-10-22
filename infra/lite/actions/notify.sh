#!/bin/bash
# Письмо владельцу из GitHub Actions — когда кнопка или проверка по
# расписанию не прошла. Тот же SMTP Яндекс 360, что у сервера; работает
# и тогда, когда сам сервер недоступен.
#   notify.sh "Тема" файл-с-текстом
. "$(dirname "$0")/lib.sh"
subject="[api.budetege.ru] $1"
text=${2:-}
if [ -z "${ALERT_EMAIL:-}" ] || [ -z "${SMTP_PASS:-}" ] || [ -z "${SMTP_USER:-}" ]; then
  echo "Почта не настроена (ALERT_EMAIL, SMTP_USER, SMTP_PASS) — письмо не ушло. GitHub всё равно пришлёт своё уведомление о сбое."
  exit 0
fi
mask "$ALERT_EMAIL"
mask "$SMTP_PASS"

body="$WORK/mail.txt"
{
  printf 'From: "Будет на ЕГЭ, GitHub" <%s>\r\n' "${SMTP_FROM:-$SMTP_USER}"
  printf 'To: <%s>\r\n' "$ALERT_EMAIL"
  printf 'Subject: =?UTF-8?B?%s?=\r\n' "$(printf '%s' "$subject" | base64 -w0)"
  printf 'Date: %s\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit\r\n\r\n' "$(date -R)"
  { [ -n "$text" ] && [ -f "$text" ] && cat "$text"; echo; echo "Запуск: ${GITHUB_SERVER_URL:-}/${GITHUB_REPOSITORY:-}/actions/runs/${GITHUB_RUN_ID:-}"; } | sed 's/$/\r/'
} > "$body"

printf 'user = "%s:%s"\n' "$SMTP_USER" "$SMTP_PASS" | curl --silent --show-error --config - \
  --url "smtps://${SMTP_HOST:-smtp.yandex.ru}:${SMTP_PORT:-465}" \
  --mail-from "${SMTP_FROM:-$SMTP_USER}" --mail-rcpt "$ALERT_EMAIL" --upload-file "$body"
echo "Письмо ушло: $subject"
