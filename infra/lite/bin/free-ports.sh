#!/bin/sh
# Порты 80 и 443 нужны Caddy: на них сайт отвечает по HTTPS и получает
# сертификат. У провайдеров в образ системы бывает предустановлен
# веб-сервер (apache2, nginx), и он эти порты держит — тогда контейнер
# Caddy не запускается («address already in use»).
#
# Скрипт смотрит, кто слушает 80 и 443. Наши контейнеры (docker-proxy)
# не помеха. Известный веб-сервер из пакетов останавливает и выключает
# его автозапуск: на этом сервере сайты он всё равно не обслуживает.
# Панель ispmanager и незнакомые программы не трогает: пишет, кто
# занял порты, и завершается с ошибкой.
#
# Вызывает bin/deploy.sh перед запуском контейнеров.
set -eu
. "$(dirname "$0")/lib.sh"

# Только для проверки скрипта на подставном каталоге.
ISPMANAGER_DIR=${ISPMANAGER_DIR:-/usr/local/mgr5}

listeners() {
  sudo ss -Hltnp '( sport = :80 or sport = :443 )' 2>/dev/null | grep -v docker-proxy || true
}

# Имена программ из вывода ss: users:(("apache2",pid=…),…).
names() {
  grep -o 'users:(("[^"]*"' | cut -d'"' -f2 | sort -u | paste -sd ' ' -
}

busy=$(listeners)
[ -n "$busy" ] || exit 0

if [ -d "$ISPMANAGER_DIR" ]; then
  log "Порты 80 и 443 заняты, на сервере стоит панель ispmanager ($(printf '%s\n' "$busy" | names))."
  log "Набору нужна чистая Ubuntu 24.04 без панели: переустановите систему в личном кабинете FirstVDS и начните заново с «Сервер: подготовить»."
  exit 1
fi

for unit in apache2 nginx lighttpd httpd caddy; do
  if systemctl is-active --quiet "$unit" 2>/dev/null; then
    log "Порты 80 и 443 занимал $unit — он стоял на сервере до набора. Останавливаю его и выключаю автозапуск"
    sudo systemctl disable --now "$unit" >/dev/null 2>&1
  fi
done

busy=$(listeners)
if [ -n "$busy" ]; then
  log "Порты 80 и 443 заняты, остановить автоматически не могу. Их держит: $(printf '%s\n' "$busy" | names)"
  log "Пришлите эту строку разработчику — по ней будет понятно, что это за программа."
  exit 1
fi
log "Порты 80 и 443 свободны"
