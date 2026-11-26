#!/bin/bash
# «Сервер: новый ключ SSH»: заменить ключ, которым GitHub Actions входит
# на сервер (пользователь deploy).
#
# Порядок такой, чтобы ни на одном шаге не остаться без входа:
#   1. новый ключ создаётся здесь, на машине GitHub;
#   2. его открытая часть дописывается на сервер — работают оба ключа;
#   3. закрытая часть записывается в секрет SERVER_SSH_KEY окружения
#      server (не получилось — старый ключ на сервере ещё действует);
#   4. вход новым ключом проверяется;
#   5. на сервере остаётся только новый ключ, старый больше не входит.
#
# Окружение: SERVER_HOST, SERVER_SSH_KEY (старый), SERVER_KNOWN_HOSTS,
# SERVER_PORT, GH_TOKEN (GH_SECRETS_TOKEN: Secrets и Environments — запись).
. "$(dirname "$0")/lib.sh"

: "${GH_TOKEN:?нет секрета GH_SECRETS_TOKEN}"
ssh_setup

umask 077
rm -f "$WORK/new_key" "$WORK/new_key.pub"
ssh-keygen -q -t ed25519 -N '' -C "github-actions-deploy@budetege $(date -u +%Y-%m-%d)" -f "$WORK/new_key"
new_pub=$(cat "$WORK/new_key.pub")
umask 022

log "1/4 Новый ключ — на сервер (старый пока работает)"
printf '%s\n' "$new_pub" | on_server 'umask 077 && cat >> ~/.ssh/authorized_keys'

log "2/4 Новый ключ — в секрет SERVER_SSH_KEY окружения server"
gh secret set SERVER_SSH_KEY --env server --repo "$GITHUB_REPOSITORY" < "$WORK/new_key"

log "3/4 Проверка входа новым ключом"
# Отдельный конфиг: в общем IdentityFile — старый ключ, и ssh пробовал бы его.
sed "s|IdentityFile .*|IdentityFile $WORK/new_key|" "$WORK/ssh_config" > "$WORK/ssh_config_new"
new_ssh=(ssh -F "$WORK/ssh_config_new" -o BatchMode=yes)
"${new_ssh[@]}" lite true

log "4/4 На сервере остаётся только новый ключ"
printf '%s\n' "$new_pub" | "${new_ssh[@]}" lite 'umask 077 && cat > ~/.ssh/authorized_keys.new && mv ~/.ssh/authorized_keys.new ~/.ssh/authorized_keys'
if ssh -F "$WORK/ssh_config" -o BatchMode=yes lite true 2>/dev/null; then
  echo "Старый ключ всё ещё входит — проверьте ~deploy/.ssh/authorized_keys на сервере"
  exit 1
fi
rm -f "$WORK/new_key" "$WORK/new_key.pub"

summary <<'MD'
### Ключ SSH заменён

- новый ключ записан в окружение **server** (секрет `SERVER_SSH_KEY`);
- старый ключ на сервере больше не входит.

Если `SERVER_SSH_KEY` есть ещё и в секретах **репозитория** — удалите его там
(Settings → Secrets and variables → Actions): он старый и больше не нужен.
MD
