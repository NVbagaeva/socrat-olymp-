#!/bin/bash
# Машины GitHub берут пакеты Ubuntu с зеркала Azure
# (azure.archive.ubuntu.com). Когда его адрес не находится, падает всё,
# что ставит пакеты: apt-get install и playwright install --with-deps.
# Так было 11.11.2026: не отвечали DNS-серверы ubuntu.com, и вместе с
# зеркалом Azure пропал archive.ubuntu.com.
#
# Скрипт проверяет зеркало Azure и, если его нет, переводит эту машину
# на первое зеркало из списка, адрес которого находится: основной
# сервер Ubuntu, затем зеркало kernel.org (другая зона DNS). Пакеты
# apt всё равно сверяет с подписью Ubuntu, поэтому зеркало подменить
# их не может. Меняется только временная машина GitHub.
#
#   apt-mirror.sh           проверить и переключить, если зеркала нет;
#   apt-mirror.sh --force   переключить без проверки.
#
# Всегда завершается успешно: если переключить не вышло, установка
# пакетов дальше пойдёт как раньше и сама сообщит об ошибке.
set -u

azure=azure.archive.ubuntu.com
fallbacks=(archive.ubuntu.com mirrors.edge.kernel.org)
# APT_MIRRORS_FILE — только для проверки скрипта на подставном файле.
mirrors=${APT_MIRRORS_FILE:-/etc/apt/apt-mirrors.txt}

resolves() {
  for _ in 1 2 3; do
    if timeout 10 getent hosts "$1" >/dev/null 2>&1; then
      return 0
    fi
    sleep 2
  done
  return 1
}

if [ "${1:-}" != "--force" ] && resolves "$azure"; then
  exit 0
fi

target=
for host in "${fallbacks[@]}"; do
  if resolves "$host"; then
    target=$host
    break
  fi
done
if [ -z "$target" ]; then
  echo "Зеркало пакетов Azure недоступно, запасные (${fallbacks[*]}) тоже — установка пакетов может не пройти"
  exit 0
fi

echo "Зеркало пакетов Azure недоступно — эта машина GitHub берёт пакеты Ubuntu с $target"
url="https://$target/ubuntu/"
if [ -f "$mirrors" ]; then
  # Выбранное зеркало — первой строкой; Azure и повтор убираем,
  # остальные строки остаются запасными.
  {
    printf '%s\tpriority:1\n' "$url"
    grep -v -e "$azure" -e "//$target/" "$mirrors" || true
  } | sudo tee "$mirrors.new" >/dev/null && sudo mv "$mirrors.new" "$mirrors"
fi
# Старые образы: адрес зеркала записан прямо в списках источников.
for list in /etc/apt/sources.list /etc/apt/sources.list.d/*.sources /etc/apt/sources.list.d/*.list; do
  if [ -f "$list" ]; then
    sudo sed -i -E "s#https?://azure\\.archive\\.ubuntu\\.com/ubuntu/?#$url#g" "$list"
  fi
done
sudo apt-get update -q -o Acquire::Retries=3 >/dev/null 2>&1 \
  || echo "Список пакетов с $target не обновился — установка может не пройти"
exit 0
