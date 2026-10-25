# shellcheck shell=sh
# Общее для скриптов на сервере: где лежит набор, как звать compose,
# как читать .env-файлы. Подключается через `. "$(dirname "$0")/lib.sh"`.

LITE_DIR=${LITE_DIR:-/opt/budetege-api}
# shellcheck disable=SC2034 # нужен скриптам, которые подключают lib.sh
STATE_DIR="$LITE_DIR/state"

# Значения из .env.generated (секреты сервера) и .env.github (то, что
# пришло кнопкой «Развернуть»). Файлы в формате KEY='value'.
load_env() {
  for file in "$LITE_DIR/.env.generated" "$LITE_DIR/.env.github"; do
    if [ -f "$file" ]; then
      set -a
      # shellcheck disable=SC1090
      . "$file"
      set +a
    fi
  done
}

# docker compose с обоими файлами окружения. В CI к набору добавляется
# compose.ci.yml (COMPOSE_EXTRA в .env.github).
dc() {
  set -- -f "$LITE_DIR/compose.yml" ${COMPOSE_EXTRA:+-f "$LITE_DIR/$COMPOSE_EXTRA"} "$@"
  docker compose --project-directory "$LITE_DIR" \
    --env-file "$LITE_DIR/.env.generated" --env-file "$LITE_DIR/.env.github" "$@"
}

psql_db() {
  dc exec -T db psql -U postgres -d postgres -v ON_ERROR_STOP=1 -q "$@"
}

log() {
  printf '%s %s\n' "$(date -u +%H:%M:%S)" "$*"
}

# rclone без файла настроек: хранилище задаётся переменными окружения.
# Remote «:s3:» — S3-совместимое хранилище (Yandex Object Storage, в CI —
# MinIO). Ключ — статический ключ сервисного аккаунта с ролью на бакет.
s3_env() {
  export RCLONE_S3_PROVIDER=Other
  export RCLONE_S3_ENDPOINT="${S3_ENDPOINT:-https://storage.yandexcloud.net}"
  export RCLONE_S3_REGION="${S3_REGION:-ru-central1}"
  export RCLONE_S3_ACCESS_KEY_ID="${S3_ACCESS_KEY_ID:?нет S3_ACCESS_KEY_ID}"
  export RCLONE_S3_SECRET_ACCESS_KEY="${S3_SECRET_ACCESS_KEY:?нет S3_SECRET_ACCESS_KEY}"
  export RCLONE_S3_NO_CHECK_BUCKET=true
  export RCLONE_S3_ENV_AUTH=false
  # Хранилище недоступно — сбой через пару минут, а не через полчаса.
  export RCLONE_CONTIMEOUT=15s RCLONE_TIMEOUT=60s RCLONE_RETRIES=3 RCLONE_LOW_LEVEL_RETRIES=2
  # shellcheck disable=SC2034 # корень копий для backup.sh и restore-check.sh
  S3_ROOT=":s3:${S3_BUCKET:?нет S3_BUCKET}/${S3_PREFIX:-budetege-api}"
}
