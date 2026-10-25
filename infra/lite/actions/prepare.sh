#!/bin/bash
# «Подготовить сервер»: один раз на чистом сервере.
#
# 1. Запоминает отпечаток ключа сервера (SERVER_KNOWN_HOSTS): дальше
#    GitHub Actions ходит только к этому серверу.
# 2. Создаёт ключ deploy (SERVER_SSH_KEY) и пару ключей шифрования
#    копий (BACKUP_AGE_IDENTITY, BACKUP_AGE_RECIPIENT).
# 3. Входит root по паролю из письма провайдера и запускает
#    server/prepare.sh base.
# 4. Проверяет вход deploy по ключу — и только потом server/prepare.sh
#    harden выключает вход root и пароли.
# 5. Проверяет, что root по паролю больше не входит, и сохраняет новые
#    ключи в GitHub Secrets (нужен GH_SECRETS_TOKEN).
#
# Повторный запуск: если секреты уже есть, они берутся из окружения и
# не меняются; на сервер он заходит как deploy по ключу.
#
# Окружение: SERVER_HOST, SERVER_ROOT_PASSWORD (первый раз), GH_TOKEN
# и GITHUB_REPOSITORY (сохранить секреты), ADMIN_SSH_PUBLIC_KEY (ваш
# ключ для туннеля к базе, можно пусто). В CI вместо GH_TOKEN —
# PREPARE_OUT: каталог, куда положить созданные ключи.
. "$(dirname "$0")/lib.sh"

: "${SERVER_HOST:?нет секрета SERVER_HOST}"
mask "$SERVER_HOST"
if [ -z "${GH_TOKEN:-}" ] && [ -z "${PREPARE_OUT:-}" ]; then
  echo "Нет секрета GH_SECRETS_TOKEN: без него созданные ключи некуда сохранить, и сервер останется без доступа. Создайте токен (docs/SERVER.md, шаг 3) и запустите снова."
  exit 1
fi

case "${ADMIN_SSH_PUBLIC_KEY:-}" in
  '' | ssh-ed25519\ * | ssh-rsa\ * | ecdsa-sha2-*) ;;
  *) echo "ADMIN_SSH_PUBLIC_KEY не похож на открытый ключ SSH (ssh-ed25519 …)"; exit 1 ;;
esac
case "${ADMIN_SSH_PUBLIC_KEY:-}" in *"'"*) echo "ADMIN_SSH_PUBLIC_KEY с кавычкой"; exit 1 ;; esac

umask 077
created=()

# ── Отпечаток ключа сервера ─────────────────────────────────────────
scanned=$(ssh-keyscan -T 20 -t ed25519 -p "${SERVER_PORT:-22}" "$SERVER_HOST" 2>/dev/null || true)
[ -n "$scanned" ] || { echo "Сервер не отвечает по SSH (порт ${SERVER_PORT:-22})"; exit 1; }
if [ -n "${SERVER_KNOWN_HOSTS:-}" ]; then
  if ! grep -qF "$(printf '%s' "$scanned" | awk '{print $3}')" <<<"$SERVER_KNOWN_HOSTS"; then
    echo "Ключ сервера не совпадает с записанным в SERVER_KNOWN_HOSTS."
    echo "Если сервер переустановлен — удалите секреты SERVER_KNOWN_HOSTS и SERVER_SSH_KEY и запустите снова."
    echo "Если нет — кто-то подменил сервер или адрес: остановитесь и напишите провайдеру."
    exit 1
  fi
  known=$SERVER_KNOWN_HOSTS
else
  known=$scanned
  created+=(SERVER_KNOWN_HOSTS)
fi
printf '%s\n' "$known" > "$WORK/known_hosts"

# ── Ключ deploy ─────────────────────────────────────────────────────
if [ -n "${SERVER_SSH_KEY:-}" ]; then
  printf '%s\n' "$SERVER_SSH_KEY" > "$WORK/deploy_key"
else
  ssh-keygen -q -t ed25519 -N '' -C "github-actions-deploy@budetege" -f "$WORK/deploy_key"
  created+=(SERVER_SSH_KEY)
fi
deploy_pub=$(ssh-keygen -y -f "$WORK/deploy_key")

# ── Ключи шифрования копий ──────────────────────────────────────────
command -v age-keygen >/dev/null || sudo apt-get install -y -q age >/dev/null
if [ -n "${BACKUP_AGE_IDENTITY:-}" ]; then
  printf '%s\n' "$BACKUP_AGE_IDENTITY" > "$WORK/age_identity"
else
  age-keygen -o "$WORK/age_identity" 2>/dev/null
  created+=(BACKUP_AGE_IDENTITY BACKUP_AGE_RECIPIENT)
fi
age-keygen -y "$WORK/age_identity" > "$WORK/age_recipient"
umask 022

# ── Вход на сервер ──────────────────────────────────────────────────
common=(-p "${SERVER_PORT:-22}" -o UserKnownHostsFile="$WORK/known_hosts" -o StrictHostKeyChecking=yes -o ConnectTimeout=20 -o LogLevel=ERROR)
as_deploy=(ssh "${common[@]}" -i "$WORK/deploy_key" -o IdentitiesOnly=yes -o BatchMode=yes "deploy@$SERVER_HOST")
if "${as_deploy[@]}" true 2>/dev/null; then
  log "Вход deploy по ключу уже работает — повторная подготовка"
  as_admin=("${as_deploy[@]}" sudo)
else
  : "${SERVER_ROOT_PASSWORD:?нет секрета SERVER_ROOT_PASSWORD (пароль root из письма провайдера)}"
  command -v sshpass >/dev/null || sudo apt-get install -y -q sshpass >/dev/null
  export SSHPASS=$SERVER_ROOT_PASSWORD
  as_admin=(sshpass -e ssh "${common[@]}" -o PreferredAuthentications=password -o PubkeyAuthentication=no "root@$SERVER_HOST")
fi

log "Файлы подготовки на сервер"
tar -C "$LITE_SRC" -cz server | "${as_admin[@]}" "rm -rf /root/budetege-prepare && mkdir -p /root/budetege-prepare && tar -xz -C /root/budetege-prepare"

log "Подготовка: пакеты, пользователи, swap, Docker, ufw, fail2ban, автообновления"
"${as_admin[@]}" "DEPLOY_PUBKEY='$deploy_pub' ADMIN_PUBKEY='${ADMIN_SSH_PUBLIC_KEY:-}' bash /root/budetege-prepare/server/prepare.sh base"

log "Проверка входа deploy по ключу"
"${as_deploy[@]}" 'id -nG | grep -qw docker && sudo -n true && docker ps >/dev/null' \
  || { echo "deploy не входит или без прав — вход root оставлен, ничего не выключено"; exit 1; }

log "Выключаю вход root и по паролю"
"${as_deploy[@]}" sudo bash /root/budetege-prepare/server/prepare.sh harden

log "Проверка: root по паролю больше не входит"
if [ -n "${SERVER_ROOT_PASSWORD:-}" ] && command -v sshpass >/dev/null; then
  if SSHPASS=$SERVER_ROOT_PASSWORD sshpass -e ssh "${common[@]}" -o PreferredAuthentications=password -o PubkeyAuthentication=no "root@$SERVER_HOST" true 2>/dev/null; then
    echo "root по паролю всё ещё входит — проверьте /etc/ssh/sshd_config.d на сервере"
    exit 1
  fi
fi
"${as_deploy[@]}" true

# ── Сохранить созданные ключи ───────────────────────────────────────
value_of() {
  case "$1" in
    SERVER_KNOWN_HOSTS) cat "$WORK/known_hosts" ;;
    SERVER_SSH_KEY) cat "$WORK/deploy_key" ;;
    BACKUP_AGE_IDENTITY) cat "$WORK/age_identity" ;;
    BACKUP_AGE_RECIPIENT) cat "$WORK/age_recipient" ;;
  esac
}
for name in "${created[@]}"; do
  if [ -n "${PREPARE_OUT:-}" ]; then
    mkdir -p "$PREPARE_OUT"
    value_of "$name" > "$PREPARE_OUT/$name"
  else
    value_of "$name" | gh secret set "$name" --repo "$GITHUB_REPOSITORY"
  fi
  log "Сохранён секрет $name"
done

summary <<MD
### Сервер подготовлен

- вход только по ключу: **deploy** (GitHub Actions) и **tunnel** (туннель к базе$([ -n "${ADMIN_SSH_PUBLIC_KEY:-}" ] && echo ', ваш ключ добавлен' || echo ', ключа пока нет'));
- root и пароли выключены, ufw: 22, 80, 443; fail2ban, автообновления безопасности, swap;
- новые секреты: ${created[*]:-нет (все уже были)}.

Секрет **SERVER_ROOT_PASSWORD** больше не нужен — его можно удалить. Дальше — «Развернуть».
MD
