#!/bin/bash
# «Проверить здоровье»: снаружи — отвечает ли api.budetege.ru по HTTPS
# с настоящим сертификатом и на месте ли записи почты в DNS (SPF, DKIM,
# DMARC); изнутри — bin/health.sh на сервере (контейнеры, API,
# сертификат, диск, память, копия).
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

# ── Почта: SPF, DKIM, DMARC ─────────────────────────────────────────
# Письма «Подтвердите почту» и «Сброс пароля» уходят с адреса
# noreply@<домен> через Яндекс 360. Без SPF и DKIM в DNS домена они
# попадают в «Спам» или не доходят вовсе, и регистрация молча ломается.
# DMARC желателен: без него это замечание, а не проблема.
#   MAIL_DOMAIN     — домен отправителя (по умолчанию из SMTP_USER);
#   DKIM_SELECTOR   — селектор DKIM, у Яндекс 360 это «mail»;
#   MAIL_DNS_CHECK=0 — пропустить (в CI: домен там ненастоящий).
txt_records() {
  local name=$1 out=
  if command -v dig >/dev/null 2>&1; then
    out=$(dig +short +time=5 +tries=2 TXT "$name" 2>/dev/null || true)
  elif command -v host >/dev/null 2>&1; then
    out=$(host -W 5 -t TXT "$name" 2>/dev/null | sed -n 's/^.*descriptive text //p' || true)
  fi
  if [ -z "$out" ]; then
    # Запасной путь — DNS поверх HTTPS: на машине может не быть dig.
    out=$(curl --silent --max-time 10 "https://dns.google/resolve?name=$name&type=TXT" 2>/dev/null \
      | python3 -c 'import json, sys
try:
    print("\n".join(a["data"] for a in json.load(sys.stdin).get("Answer", []) if a.get("type") == 16))
except Exception:
    pass' || true)
  fi
  # Длинная запись режется на куски в кавычках — склеиваем.
  printf '%s\n' "$out" | sed 's/" "//g; s/"//g'
}

if [ "${MAIL_DNS_CHECK:-1}" != "0" ]; then
  sender=${SMTP_FROM:-${SMTP_USER:-noreply@budetege.ru}}
  mail_domain=${MAIL_DOMAIN:-${sender#*@}}
  selector=${DKIM_SELECTOR:-mail}
  if [ -z "$(txt_records "$mail_domain")" ]; then
    # Ни одной TXT-записи у домена не бывает: значит, не ответил сам DNS.
    say "OK        почта: DNS для $mail_domain сейчас не отвечает, записи не проверены"
  else
    spf=$(txt_records "$mail_domain" | grep -i '^v=spf1' | head -1 || true)
    if [ -z "$spf" ]; then
      say "ПРОБЛЕМА  почта: у $mail_domain нет записи SPF (TXT «v=spf1 …») — письма будут уходить в спам"
      status=1
    elif [ "${SMTP_HOST:-smtp.yandex.ru}" = "smtp.yandex.ru" ] && ! printf '%s' "$spf" | grep -qi 'yandex'; then
      say "ПРОБЛЕМА  почта: SPF у $mail_domain не разрешает отправку через Яндекс ($spf)"
      status=1
    else
      say "OK        почта: SPF на месте"
    fi
    dkim=$(txt_records "$selector._domainkey.$mail_domain" | grep -i 'v=DKIM1' | head -1 || true)
    if printf '%s' "$dkim" | grep -Eq 'p=[A-Za-z0-9+/]{100,}'; then
      say "OK        почта: DKIM на месте ($selector._domainkey)"
    else
      say "ПРОБЛЕМА  почта: нет записи DKIM $selector._domainkey.$mail_domain — письма будут уходить в спам"
      status=1
    fi
    if txt_records "_dmarc.$mail_domain" | grep -qi '^v=DMARC1'; then
      say "OK        почта: DMARC на месте"
    else
      say "ЗАМЕЧАНИЕ почта: записи DMARC нет. Добавьте в DNS TXT-запись _dmarc со значением «v=DMARC1; p=none» — почтовые сервисы меньше придираются к письмам"
    fi
  fi
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
