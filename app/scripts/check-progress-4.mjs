#!/usr/bin/env node
/* scripts/check-progress-4.mjs — тренажёр №4 в «Стеклянной сцене»: перенос
   прежнего прогресса, каталог, тренировки, запись сессии, запись ответа и
   тексты карты. Общая часть с №5 — scripts/lib/check-progress-45.mjs.

   Запуск: node scripts/check-progress-4.mjs */

import { requireSrc } from './lib/load-ts.mjs';
import { itog45, proveritProgress45 } from './lib/check-progress-45.mjs';

const rezultat = proveritProgress45(4);
const { failures } = rezultat;
let dop = 0;
const check = (ok, what) => {
  dop += 1;
  if (!ok) failures.push(what);
};

/* ── 6. Тексты карты №4 ──────────────────────────────────────── */
const { BANK_4 } = requireSrc('lib/veroyatnost/index.ts');
const { TIPY4_OPASNO, GRUPPY4_TON, FORMULY4, NAVYKI4 } = requireSrc('content/veroyatnost4.ts');
const { PODGOTOVKA_4 } = requireSrc('lib/veroyatnost/index.ts');
for (const p of BANK_4) {
  check(
    typeof TIPY4_OPASNO[p.id] === 'string' && TIPY4_OPASNO[p.id].length > 20,
    `у типа «${p.nazvanie}» нет текста «Где теряют балл»`,
  );
  check(GRUPPY4_TON[p.blok] !== undefined, `у метода ${p.blok} нет тона`);
}
check(
  Object.keys(TIPY4_OPASNO).every((id) => BANK_4.some((p) => p.id === id)),
  'текст «Где теряют балл» у несуществующего типа',
);
check(FORMULY4.length > 0, 'нет блока «Что нужно знать»');
/* Примеры «Что нужно знать» посчитаны верно: числа из примеров. */
const okrugl = (x, n) => Math.round(x * 10 ** n) / 10 ** n;
for (const [chto, ok] of [
  ['10/25 = 0,4', 10 / 25 === 0.4],
  ['1 − 0,35 = 0,65', okrugl(1 - 0.35, 9) === 0.65],
  ['3/36 ≈ 0,08', okrugl(3 / 36, 2) === 0.08],
  ['3/15 = 0,2', 3 / 15 === 0.2],
  ['200/400 = 0,5', 200 / 400 === 0.5],
  ['110/113 ≈ 0,97', okrugl(110 / 113, 2) === 0.97],
]) {
  check(ok, `«Что нужно знать»: пример ${chto} посчитан неверно`);
}
const bloki = NAVYKI4.flatMap((n) => n.bloki);
check(
  bloki.length === PODGOTOVKA_4.length && PODGOTOVKA_4.every((b) => bloki.includes(b.id)),
  'опорные: не каждый блок попал ровно в один навык',
);

itog45(4, rezultat, dop);
