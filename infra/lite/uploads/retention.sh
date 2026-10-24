#!/bin/sh
# Ночная очистка: фото решений с истёкшим сроком хранения удаляются из
# бакета и базы, баллы и комментарии остаются (uploads/retention.mjs).
# Запускает таймер budetege-photos.timer. Пока часть 2 на сервере не
# включена (CHAST2_ENABLED в Variables), ничего не делает.
set -eu
. /opt/budetege-api/bin/lib.sh
load_env
[ "${CHAST2_ENABLED:-0}" = 1 ] || exit 0
cd /opt/budetege-api
exec bin/dc --profile chast2 run --rm --no-deps uploads node retention.mjs
