#!/bin/sh
# Письмо владельцу через тот же SMTP, что у службы входа (Яндекс 360).
#   bin/mail.sh "Тема" < текст
# Пароль передаётся curl через стандартный ввод конфигурации, а не в
# командной строке, — в списке процессов его не видно.
set -eu
. "$(dirname "$0")/lib.sh"
load_env

subject="[api.budetege.ru] $1"
to="${ALERT_EMAIL:-}"
if [ -z "$to" ] || { [ -z "${SMTP_PASS:-}" ] && [ "${MAIL_NO_AUTH:-}" != "1" ]; }; then
  log "Почта не настроена (ALERT_EMAIL или SMTP_PASS) — письмо не ушло: $subject"
  exit 0
fi

body=$(mktemp)
trap 'rm -f "$body"' EXIT
encoded=$(printf '%s' "$subject" | base64 | tr -d '\n')
{
  printf 'From: "Будет на ЕГЭ, сервер" <%s>\r\n' "${SMTP_FROM:-$SMTP_USER}"
  printf 'To: <%s>\r\n' "$to"
  printf 'Subject: =?UTF-8?B?%s?=\r\n' "$encoded"
  printf 'Date: %s\r\n' "$(date -R)"
  printf 'MIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit\r\n\r\n'
  sed 's/$/\r/'
} > "$body"

# Адрес SMTP для писем с самого сервера. Обычно тот же, что у GoTrue;
# в CI GoTrue ходит в контейнер mailpit, а сервер — на 127.0.0.1:1025.
host=${MAIL_SMTP_HOST:-${SMTP_HOST:-smtp.yandex.ru}}
port=${MAIL_SMTP_PORT:-${SMTP_PORT:-465}}
scheme=smtps
[ "$port" = "465" ] || scheme=smtp
# В CI (MAIL_NO_AUTH=1) письмо уходит в Mailpit без входа.
if [ "${MAIL_NO_AUTH:-}" = "1" ]; then
  auth=''
else
  auth=$(printf 'user = "%s:%s"' "$SMTP_USER" "$SMTP_PASS")
fi
printf '%s\n' "$auth" | curl --silent --show-error --config - \
  --url "$scheme://$host:$port" \
  --mail-from "${SMTP_FROM:-$SMTP_USER}" --mail-rcpt "$to" --upload-file "$body"
log "Письмо ушло: $subject"
