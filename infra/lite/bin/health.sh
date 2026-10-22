#!/bin/bash
# Проверка здоровья сервера изнутри. Печатает «OK …» и «ПРОБЛЕМА …»
# по пунктам и выходит с кодом 1, если есть хоть одна проблема.
#
#   контейнеры набора запущены и здоровы;
#   API отвечает: Caddy, GoTrue, PostgREST (через HTTPS на 127.0.0.1);
#   сертификат api.budetege.ru действует ещё 14 дней и больше
#     (пока A-записи нет, пункт пропускается);
#   на диске занято меньше 85 %, памяти свободно больше 10 %,
#     swap занят меньше 60 %;
#   последняя копия базы моложе 26 часов.
#
# С --mail (так запускает таймер budetege-health.timer каждые 15 минут)
# о проблемах уходит письмо: одно на набор проблем, повтор — не чаще
# раза в 6 часов, и письмо «снова в порядке», когда всё прошло.
# Недоступность самого сервера отсюда не видна — её ловит кнопка
# «Проверить здоровье» по расписанию из GitHub.
set -uo pipefail
. "$(dirname "$0")/lib.sh"
load_env
cd "$LITE_DIR" || exit 1

problems=()
ok() { printf 'OK        %s\n' "$*"; }
bad() { printf 'ПРОБЛЕМА  %s\n' "$*"; problems+=("$*"); }

# ── Контейнеры ──────────────────────────────────────────────────────
states=$(dc ps --all --format json 2>/dev/null | python3 -c '
import json, sys
rows = [json.loads(line) for line in sys.stdin if line.strip()]
if rows and isinstance(rows[0], list):
    rows = rows[0]
for row in rows:
    print(row.get("Service"), row.get("State"), row.get("Health") or "-")
')
for service in db auth rest caddy; do
  line=$(printf '%s\n' "$states" | awk -v s="$service" '$1 == s')
  state=$(printf '%s' "$line" | awk '{print $2}')
  health=$(printf '%s' "$line" | awk '{print $3}')
  if [ "$state" = "running" ] && [ "$health" = "healthy" ]; then
    ok "контейнер $service: работает"
  else
    bad "контейнер $service: ${state:-нет} / ${health:-нет}"
  fi
done

# ── API через Caddy ─────────────────────────────────────────────────
api() {
  curl --silent --show-error --max-time 10 --insecure \
    --resolve "$API_DOMAIN:443:127.0.0.1" -o /dev/null -w '%{http_code}' "$@"
}
code=$(api "https://$API_DOMAIN/health" 2>/dev/null)
[ "$code" = "200" ] && ok "Caddy: /health 200" || bad "Caddy: /health ответил ${code:-ничего}"
code=$(api -H "apikey: $ANON_KEY" "https://$API_DOMAIN/auth/v1/health" 2>/dev/null)
[ "$code" = "200" ] && ok "GoTrue: /auth/v1/health 200" || bad "GoTrue: /auth/v1/health ответил ${code:-ничего}"
code=$(api -H "apikey: $ANON_KEY" "https://$API_DOMAIN/rest/v1/profiles?select=id&limit=1" 2>/dev/null)
[ "$code" = "200" ] && ok "PostgREST: /rest/v1/profiles 200" || bad "PostgREST: /rest/v1/profiles ответил ${code:-ничего}"

# ── Сертификат ──────────────────────────────────────────────────────
min_days=${CERT_MIN_DAYS:-14}
if [ -z "$(getent ahostsv4 "$API_DOMAIN" 2>/dev/null)" ]; then
  ok "сертификат: A-записи $API_DOMAIN ещё нет, проверка пропущена"
else
  end=$(echo | openssl s_client -connect 127.0.0.1:443 -servername "$API_DOMAIN" 2>/dev/null \
    | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
  if [ -z "$end" ]; then
    bad "сертификат: Caddy не отдаёт сертификат для $API_DOMAIN"
  else
    left=$(( ($(date -d "$end" +%s) - $(date +%s)) / 86400 ))
    [ "$left" -ge "$min_days" ] && ok "сертификат: ещё $left дн." || bad "сертификат: осталось $left дн. (продление не прошло?)"
  fi
fi

# ── Диск, память, swap ──────────────────────────────────────────────
disk=$(df -P / | awk 'NR == 2 { gsub("%", "", $5); print $5 }')
[ "$disk" -lt 85 ] && ok "диск: занято $disk %" || bad "диск: занято $disk %"
read -r total avail swap_total swap_free < <(awk '
  /^MemTotal:/ { t = $2 } /^MemAvailable:/ { a = $2 }
  /^SwapTotal:/ { st = $2 } /^SwapFree:/ { sf = $2 }
  END { print t, a, st, sf }' /proc/meminfo)
mem_free=$(( avail * 100 / total ))
[ "$mem_free" -gt 10 ] && ok "память: свободно $mem_free %" || bad "память: свободно $mem_free %"
if [ "$swap_total" -gt 0 ]; then
  swap_used=$(( (swap_total - swap_free) * 100 / swap_total ))
  [ "$swap_used" -lt 60 ] && ok "swap: занято $swap_used %" || bad "swap: занято $swap_used %"
fi

# ── Копия базы ──────────────────────────────────────────────────────
now=$(date +%s)
if [ -f "$STATE_DIR/last-backup" ]; then
  read -r at name < "$STATE_DIR/last-backup"
  hours=$(( (now - at) / 3600 ))
  [ "$hours" -lt 26 ] && ok "копия: $name, $hours ч назад" || bad "копия: последняя $hours ч назад ($name)"
else
  since=$(cat "$STATE_DIR/installed-at" 2>/dev/null || echo "$now")
  if [ $(( now - since )) -lt $(( 26 * 3600 )) ]; then
    ok "копия: сервер развёрнут меньше суток назад, первая копия — ночью"
  else
    bad "копия: ни одной копии ещё не было"
  fi
fi

# ── Итог и письмо ───────────────────────────────────────────────────
if [ "${1:-}" = "--mail" ]; then
  mark="$STATE_DIR/alert"
  if [ "${#problems[@]}" -gt 0 ]; then
    digest=$(printf '%s\n' "${problems[@]}" | sed 's/[0-9]\+/N/g' | sha256sum | cut -c1-16)
    last_digest=$(cut -d' ' -f2 "$mark" 2>/dev/null || true)
    last_at=$(cut -d' ' -f1 "$mark" 2>/dev/null || echo 0)
    if [ "$digest" != "$last_digest" ] || [ $(( now - last_at )) -ge $(( 6 * 3600 )) ]; then
      printf 'Проверка здоровья сервера нашла проблемы:\n\n%s\n\nЧто делать — docs/SERVER.md, раздел «Если что-то сломалось».\n' \
        "$(printf -- '- %s\n' "${problems[@]}")" | "$LITE_DIR/bin/mail.sh" "Проблема на сервере" || true
      printf '%s %s\n' "$now" "$digest" > "$mark"
    fi
  elif [ -f "$mark" ]; then
    printf 'Проверка здоровья: всё снова в порядке.\n' | "$LITE_DIR/bin/mail.sh" "Снова в порядке" || true
    rm -f "$mark"
  fi
fi

[ "${#problems[@]}" -eq 0 ]
