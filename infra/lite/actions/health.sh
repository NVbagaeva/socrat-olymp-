#!/bin/bash
# «Проверить здоровье»: снаружи — отвечает ли api.budetege.ru по HTTPS
# с настоящим сертификатом; изнутри — bin/health.sh на сервере
# (контейнеры, API, сертификат, диск, память, копия).
#
# Отчёт — в $WORK/health.txt (его же шлёт письмом notify.sh при сбое).
. "$(dirname "$0")/lib.sh"
report="$WORK/health.txt"
: > "$report"
status=0

say() { printf '%s\n' "$*" | tee -a "$report"; }

# ── Снаружи ─────────────────────────────────────────────────────────
# EXTERNAL_CACERT — только в CI: корневой сертификат своего центра Caddy.
if [ -n "${API_DOMAIN:-}" ] && getent ahostsv4 "$API_DOMAIN" >/dev/null 2>&1; then
  code=$(curl --silent --max-time 15 ${EXTERNAL_CACERT:+--cacert "$EXTERNAL_CACERT"} \
    -o /dev/null -w '%{http_code}' "https://$API_DOMAIN/health" 2>/dev/null || true)
  if [ "$code" = "200" ]; then
    say "OK        снаружи: https://$API_DOMAIN/health 200, сертификат принят"
  else
    error=$(curl --silent --show-error --max-time 15 ${EXTERNAL_CACERT:+--cacert "$EXTERNAL_CACERT"} \
      -o /dev/null "https://$API_DOMAIN/health" 2>&1 | head -1 || true)
    say "ПРОБЛЕМА  снаружи: https://$API_DOMAIN/health — ${error:-ответ $code}"
    status=1
  fi
else
  say "OK        снаружи: A-записи ${API_DOMAIN:-api} ещё нет, проверка HTTPS пропущена"
fi

# ── Изнутри ─────────────────────────────────────────────────────────
if [ -n "${SERVER_SSH_KEY:-}" ] && [ -n "${SERVER_KNOWN_HOSTS:-}" ] && [ -n "${SERVER_HOST:-}" ] \
  && ssh_setup 2>>"$report" && on_server true 2>>"$report"; then
  if ! on_server "$REMOTE_DIR/bin/health.sh" 2>&1 | tee -a "$report"; then
    status=1
  fi
else
  say "ПРОБЛЕМА  сервер не отвечает по SSH"
  status=1
fi

summary <<MD
### Здоровье сервера

\`\`\`
$(cat "$report")
\`\`\`
MD
exit "$status"
