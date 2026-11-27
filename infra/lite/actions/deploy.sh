#!/bin/bash
# «Развернуть»: файлы набора на сервер, .env.github из GitHub Secrets и
# Variables, затем bin/deploy.sh на сервере (секреты сервера при первом
# запуске, таймеры, docker compose pull и up).
#
# Окружение — см. .github/workflows/server-deploy.yml.
. "$(dirname "$0")/lib.sh"
ssh_setup

for secret in SMTP_PASS S3_SECRET_ACCESS_KEY S3_ACCESS_KEY_ID ALERT_EMAIL ROBOKASSA_PASS1 ROBOKASSA_PASS2; do
  mask "${!secret:-}"
done

: "${API_DOMAIN:?нет переменной API_DOMAIN}"
: "${SITE_ORIGIN:?нет переменной SITE_ORIGIN}"
: "${BACKUP_AGE_RECIPIENT:?нет секрета BACKUP_AGE_RECIPIENT — сначала «Подготовить сервер»}"

sync_files

log "Окружение набора (.env.github)"
{
  env_line API_DOMAIN "$API_DOMAIN"
  env_line SITE_ORIGIN "$SITE_ORIGIN"
  env_line SITE_ORIGIN_2 "${SITE_ORIGIN_2:-$SITE_ORIGIN}"
  env_line ACME_EMAIL "${ACME_EMAIL:-${ALERT_EMAIL:?нет секрета ALERT_EMAIL}}"
  env_line ALERT_EMAIL "${ALERT_EMAIL:-}"
  env_line SMTP_HOST "${SMTP_HOST:-smtp.yandex.ru}"
  env_line SMTP_PORT "${SMTP_PORT:-465}"
  env_line SMTP_USER "${SMTP_USER:-}"
  env_line SMTP_PASS "${SMTP_PASS:-}"
  env_line SMTP_FROM "${SMTP_FROM:-${SMTP_USER:-noreply@budetege.ru}}"
  env_line S3_ENDPOINT "${S3_ENDPOINT:-https://storage.yandexcloud.net}"
  env_line S3_REGION "${S3_REGION:-ru-central1}"
  env_line S3_BUCKET "${S3_BUCKET:-}"
  env_line S3_PREFIX "${S3_PREFIX:-budetege-api}"
  env_line S3_ACCESS_KEY_ID "${S3_ACCESS_KEY_ID:-}"
  env_line S3_SECRET_ACCESS_KEY "${S3_SECRET_ACCESS_KEY:-}"
  env_line BACKUP_AGE_RECIPIENT "$BACKUP_AGE_RECIPIENT"
  # Robokassa (docs/oplata-robokassa.md): логин магазина и настройки —
  # переменные, Пароли №1 и №2 — секреты. Пусто — оплата выключена.
  env_line ROBOKASSA_LOGIN "${ROBOKASSA_LOGIN:-}"
  env_line ROBOKASSA_PASS1 "${ROBOKASSA_PASS1:-}"
  env_line ROBOKASSA_PASS2 "${ROBOKASSA_PASS2:-}"
  env_line ROBOKASSA_HASH "${ROBOKASSA_HASH:-md5}"
  env_line ROBOKASSA_TEST "${ROBOKASSA_TEST:-}"
  env_line ROBOKASSA_RECEIPT "${ROBOKASSA_RECEIPT:-}"
  # Только в CI: дополнительный compose-файл, свой центр сертификатов,
  # почта без входа и короткий срок сертификата.
  env_line COMPOSE_EXTRA "${COMPOSE_EXTRA:-}"
  env_line CADDY_EXTRA_GLOBAL "${CADDY_EXTRA_GLOBAL:-}"
  env_line CERT_MIN_DAYS "${CERT_MIN_DAYS:-14}"
  env_line MAIL_NO_AUTH "${MAIL_NO_AUTH:-}"
  env_line MAIL_SMTP_HOST "${MAIL_SMTP_HOST:-}"
  env_line MAIL_SMTP_PORT "${MAIL_SMTP_PORT:-}"
  env_line NOTIFIER_INTERVAL_MS "${NOTIFIER_INTERVAL_MS:-}"
  env_line SKIP_TIMERS "${SKIP_TIMERS:-}"
} | on_server "umask 077 && cat > $REMOTE_DIR/.env.github"

log "Запуск набора на сервере"
on_server "$REMOTE_DIR/bin/deploy.sh"

summary <<MD
### Набор развёрнут

| Сервис | Состояние |
|---|---|
$(on_server "$REMOTE_DIR/bin/dc ps --format '| {{.Service}} | {{.Status}} |'")

Дальше, если это первый запуск, — «Миграции».
MD
