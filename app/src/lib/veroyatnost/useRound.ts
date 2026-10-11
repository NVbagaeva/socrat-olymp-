/**
 * Подход тренажёра заданий №4 и №5: какие задания и в каком порядке.
 *
 * Подход собирает браузер в момент нажатия «Начать тренировку», а не
 * при отрисовке: случайный порядок при отрисовке разошёлся бы с
 * разметкой сервера. Собранный подход целиком уходит в сессию
 * тренажёра (components/tasks/veroyatnost/sessiyaPayload.ts) и
 * восстанавливается оттуда, поэтому хранилища подходов в памяти,
 * как у соседних тренажёров, здесь больше нет.
 *
 * Сама сборка берётся из lib/zadanie3/podhod: модуль чистый, про
 * стереометрию в нём нет ни строчки (тип — это «идентификатор и
 * список номеров вариантов»), и у него есть свой автотест в CI.
 * Вторая копия этих же ста сорока строк разъехалась бы с первой —
 * поэтому здесь ссылка, а не копия. Задание №3 при этом не меняется.
 */

import { buildRound, seeded, type RoundItem, type RoundKind } from '../zadanie3/podhod';

export { ROUND_SIZE, otherVariant, type RoundItem, type RoundKind } from '../zadanie3/podhod';

/** Зерно подхода берётся здесь, а не в компоненте при отрисовке. */
function freshSeed(): number {
  return (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
}

/** Новый подход: другие задания и другой порядок на каждый вызов. */
export function sobratPodhod(source: RoundKind[], size: number): RoundItem[] {
  return buildRound(source, seeded(freshSeed()), size);
}
