# shellcheck shell=bash
# Общее для шагов GitHub Actions, которые ходят на сервер по SSH.
# Подключается: `. "$(dirname "$0")/lib.sh"`.
#
# Окружение (из GitHub Secrets и Variables, см. docs/SERVER.md):
#   SERVER_HOST         — IP сервера;
#   SERVER_SSH_KEY      — закрытый ключ пользователя deploy;
#   SERVER_KNOWN_HOSTS  — отпечаток ключа сервера, записанный при подготовке;
#   SERVER_PORT         — порт SSH, если не 22 (необязательно).

set -euo pipefail

REPO_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)
LITE_SRC="$REPO_ROOT/infra/lite"
REMOTE_DIR=/opt/budetege-api
WORK=${RUNNER_TEMP:-/tmp}/budetege-lite
mkdir -p "$WORK"
chmod 700 "$WORK"

log() { printf '%s %s\n' "$(date -u +%H:%M:%S)" "$*"; }

# Пакеты Ubuntu на машину GitHub (не на сервер). Зеркало Azure, с
# которого машина берёт пакеты, бывает недоступно часами: тогда
# повторяем со свежим списком пакетов, а затем переводим машину на
# запасное зеркало (.github/scripts/apt-mirror.sh). Меняется только
# временная машина GitHub.
runner_install() {
  local try
  for try in 1 2 3; do
    case $try in
      2) sudo apt-get update -q -o Acquire::Retries=3 >/dev/null || true ;;
      3) bash "$REPO_ROOT/.github/scripts/apt-mirror.sh" --force || true ;;
    esac
    if sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -q -o Acquire::Retries=3 "$@" >/dev/null; then
      return 0
    fi
  done
  echo "Не удалось поставить на машину GitHub: $*. Это сбой у GitHub или у серверов Ubuntu, не вашего сервера и не секретов: запустите кнопку ещё раз позже."
  return 1
}

# Значение не попадает в журнал GitHub Actions, даже если его напечатать.
mask() {
  if [ -n "${GITHUB_ACTIONS:-}" ] && [ -n "${1:-}" ]; then
    while IFS= read -r line; do
      [ -n "$line" ] && echo "::add-mask::$line"
    done <<<"$1"
  fi
}

# Ключ и отпечаток сервера — в файлы с правами 600; ssh дальше ходит
# как `ssh lite …` и сверяет ключ сервера строго.
ssh_setup() {
  : "${SERVER_HOST:?нет секрета SERVER_HOST}"
  : "${SERVER_SSH_KEY:?нет секрета SERVER_SSH_KEY — сначала «Подготовить сервер»}"
  : "${SERVER_KNOWN_HOSTS:?нет секрета SERVER_KNOWN_HOSTS — сначала «Подготовить сервер»}"
  mask "$SERVER_HOST"
  umask 077
  printf '%s\n' "$SERVER_SSH_KEY" > "$WORK/deploy_key"
  printf '%s\n' "$SERVER_KNOWN_HOSTS" > "$WORK/known_hosts"
  cat > "$WORK/ssh_config" <<CONF
Host lite
  HostName $SERVER_HOST
  Port ${SERVER_PORT:-22}
  User deploy
  IdentityFile $WORK/deploy_key
  IdentitiesOnly yes
  UserKnownHostsFile $WORK/known_hosts
  StrictHostKeyChecking yes
  ConnectTimeout 20
  ServerAliveInterval 30
  LogLevel ERROR
CONF
  umask 022
}

on_server() {
  ssh -F "$WORK/ssh_config" lite "$@"
}

# Значение для .env-файла: одной строкой и без одинарной кавычки —
# файл читают и docker compose, и sh (KEY='value').
env_line() {
  local key=$1 value=${2-}
  case "$value" in
    *"'"* | *$'\n'*) echo "Значение $key содержит кавычку или перевод строки" >&2; return 1 ;;
  esac
  printf "%s='%s'\n" "$key" "$value"
}

# Файлы набора на сервер: compose, Caddyfile, скрипты, шаблоны писем,
# миграции по списку migrations.txt, каталог банка. Секреты (.env.*) и состояние
# (state/) на сервере не трогаются.
sync_files() {
  local stage="$WORK/stage"
  rm -rf "$stage"
  mkdir -p "$stage/templates" "$stage/migrations" "$stage/catalog"
  cp -R "$LITE_SRC/compose.yml" "$LITE_SRC/compose.ci.yml" "$LITE_SRC/Caddyfile" \
    "$LITE_SRC/db" "$LITE_SRC/bin" "$LITE_SRC/server" "$stage/"
  cp "$REPO_ROOT"/supabase/templates/*.html "$stage/templates/"
  local n=0 path
  while IFS= read -r path; do
    case "$path" in '' | '#'*) continue ;; esac
    n=$((n + 1))
    cp "$REPO_ROOT/$path" "$stage/migrations/$(printf '%03d' "$n")-$(basename "$path")"
  done < "$LITE_SRC/migrations.txt"
  # Каталог банка для кабинета: применяется при каждом «Миграции».
  cp "$REPO_ROOT/supabase/seed/kabinet_katalog.sql" "$stage/catalog/"
  log "На сервер: набор, $(ls "$stage/templates" | wc -l) шаблона писем, миграций $n, каталог банка"
  # Файлы без секретов: читать их можно всем, и postgres в контейнере
  # (uid 70) должен видеть db/. Секреты — в .env.*, они здесь не трогаются.
  rsync -rlpt --delete --chmod=D755,F644 \
    --exclude '/.env.*' --exclude '/state/' \
    -e "ssh -F $WORK/ssh_config" "$stage/" "lite:$REMOTE_DIR/"
  on_server "chmod 755 $REMOTE_DIR/bin/* $REMOTE_DIR/db/*.sh $REMOTE_DIR/server/prepare.sh"
}

# Итог шага — в сводку запуска GitHub Actions.
summary() {
  if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
    cat >> "$GITHUB_STEP_SUMMARY"
  else
    cat
  fi
}
