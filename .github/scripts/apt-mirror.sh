#!/bin/bash
# Машины GitHub берут пакеты Ubuntu с зеркала Azure
# (azure.archive.ubuntu.com). Когда оно не отвечает, падает всё, что
# ставит пакеты: apt-get install и playwright install --with-deps.
# Скрипт проверяет зеркало и, если его нет, переводит эту машину на
# archive.ubuntu.com. Меняется только временная машина GitHub.
#
#   apt-mirror.sh           проверить и переключить, если зеркала нет;
#   apt-mirror.sh --force   переключить без проверки.
#
# Всегда завершается успешно: если переключить не вышло, установка
# пакетов дальше пойдёт как раньше и сама сообщит об ошибке.
set -u

host=azure.archive.ubuntu.com
# APT_MIRRORS_FILE — только для проверки скрипта на подставном файле.
mirrors=${APT_MIRRORS_FILE:-/etc/apt/apt-mirrors.txt}

resolves() {
  for _ in 1 2 3; do
    if timeout 10 getent hosts "$host" >/dev/null 2>&1; then
      return 0
    fi
    sleep 2
  done
  return 1
}

if [ "${1:-}" != "--force" ] && resolves; then
  exit 0
fi

echo "Зеркало пакетов Azure недоступно — эта машина GitHub берёт пакеты Ubuntu с archive.ubuntu.com"
if [ -f "$mirrors" ]; then
  if grep -v "$host" "$mirrors" | grep -q '[^[:space:]]'; then
    # В списке есть другие зеркала — убираем только Azure.
    sudo sed -i '/azure\.archive\.ubuntu\.com/d' "$mirrors"
  else
    sudo sed -i -E 's#https?://azure\.archive\.ubuntu\.com#https://archive.ubuntu.com#g' "$mirrors"
  fi
fi
# Старые образы: адрес зеркала записан прямо в списках источников.
for list in /etc/apt/sources.list /etc/apt/sources.list.d/*.sources /etc/apt/sources.list.d/*.list; do
  if [ -f "$list" ]; then
    sudo sed -i -E 's#https?://azure\.archive\.ubuntu\.com#http://archive.ubuntu.com#g' "$list"
  fi
done
sudo apt-get update -q -o Acquire::Retries=3 >/dev/null 2>&1 \
  || echo "Список пакетов с archive.ubuntu.com не обновился — установка может не пройти"
exit 0
