#!/usr/bin/env node
/* scripts/check-progress-5.mjs — тренажёр №5 в «Стеклянной сцене»: перенос
   прежнего прогресса, каталог, тренировки, запись сессии, запись ответа и
   тексты карты. Общая часть с №4 — scripts/lib/check-progress-45.mjs.

   Запуск: node scripts/check-progress-5.mjs */

import { requireSrc } from './lib/load-ts.mjs';
import { itog45, proveritProgress45 } from './lib/check-progress-45.mjs';

const rezultat = proveritProgress45(5);
const { failures } = rezultat;
let dop = 0;
const check = (ok, what) => {
  dop += 1;
  if (!ok) failures.push(what);
};

/* ── 6. Тексты карты №5 ──────────────────────────────────────── */
const { BANK_5 } = requireSrc('lib/veroyatnost/index.ts');
const { TIPY5_OPASNO, FORMULY5, NAVYKI5 } = requireSrc('content/veroyatnost5.ts');
const { PODGOTOVKA_5 } = requireSrc('lib/veroyatnost/index.ts');
for (const p of BANK_5) {
  check(
    typeof TIPY5_OPASNO[p.id] === 'string' && TIPY5_OPASNO[p.id].length > 20,
    `у типа «${p.nazvanie}» нет текста «Где теряют балл»`,
  );
}
check(
  Object.keys(TIPY5_OPASNO).every((id) => BANK_5.some((p) => p.id === id)),
  'текст «Где теряют балл» у несуществующего типа',
);
check(FORMULY5.length > 0, 'нет блока «Что нужно знать»');
/* Примеры «Что нужно знать» посчитаны верно: числа из примеров. */
const okrugl = (x, n) => Math.round(x * 10 ** n) / 10 ** n;
for (const [chto, ok] of [
  ['0,2 + 0,35 = 0,55', okrugl(0.2 + 0.35, 9) === 0.55],
  ['0,1 + 0,1 − 0,03 = 0,17', okrugl(0.1 + 0.1 - 0.03, 9) === 0.17],
  ['1 − 0,87 = 0,13', okrugl(1 - 0.87, 9) === 0.13],
  ['1 − 0,8³ = 0,488', okrugl(1 - 0.8 ** 3, 9) === 0.488],
  ['0,5 · 0,32 = 0,16', okrugl(0.5 * 0.32, 9) === 0.16],
  ['нет шестёрок: 3/25 = 0,12', 3 / 25 === 0.12],
  ['0,7 · 0,03 + 0,3 · 0,04 = 0,033', okrugl(0.7 * 0.03 + 0.3 * 0.04, 9) === 0.033],
  ['1 − 0,5² = 0,75 ≥ 0,7, а 1 − 0,5 < 0,7', 1 - 0.5 ** 2 >= 0.7 && 1 - 0.5 < 0.7],
]) {
  check(ok, `«Что нужно знать»: пример ${chto} посчитан неверно`);
}
const bloki = NAVYKI5.flatMap((n) => n.bloki.map((b) => b.id));
check(
  bloki.length === PODGOTOVKA_5.length && PODGOTOVKA_5.every((b) => bloki.includes(b.id)),
  'опорные: не каждый блок попал ровно в один навык',
);
const { navykiZadaniya } = requireSrc('components/tasks/veroyatnost/metody.ts');
check(
  NAVYKI5.every((n) => n.bloki.every((b) => navykiZadaniya(5).some((m) => m.id === b.znak))),
  'опорные: значок блока — не метод №5',
);

itog45(5, rezultat, dop);
