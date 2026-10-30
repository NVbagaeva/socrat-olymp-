#!/usr/bin/env node
/* scripts/verify_schemes/index.mjs — все проверки ключевых схем №18.

   Каждая схема — свой файл с proverit(N): N случайных невырожденных
   конфигураций (по умолчанию 1000), численная проверка каждого
   следствия и шага доказательства, плюс экранная раскладка. Факт,
   который не прошёл проверку, не публикуется: ненулевой код возврата.

   Плюс механика коробок Лейтнера (lib/zadanie18/progress).

   Запуск: pnpm test:skhemy-18 [N] */

import { requireSrc } from '../lib/load-ts.mjs';
import { proverit as vysoty } from './vysoty.mjs';

const N = Number(process.argv[2] ?? 1000);
let plokho = 0;
plokho += vysoty(N).plokho;

/* Коробки Лейтнера: «Знаю» — следующая (не ниже второй, не выше пятой),
   «Не знаю» — первая. */
const { sleduyushchayaKorobka, status18, poryadokKolody } = requireSrc('lib/zadanie18/progress');
const sluchai = [
  [undefined, true, 2],
  [1, true, 2],
  [2, true, 3],
  [5, true, 5],
  [4, false, 1],
  [undefined, false, 1],
];
for (const [k, znayu, zhdu] of sluchai) {
  const vyshlo = sleduyushchayaKorobka(k, znayu);
  if (vyshlo !== zhdu) {
    console.log(`✗ коробка ${k}, ${znayu ? 'Знаю' : 'Не знаю'}: ${vyshlo}, а нужно ${zhdu}`);
    plokho += 1;
  }
}
const st = [status18(undefined), status18({ korobka: 1 }), status18({ korobka: 3 })].join(',');
if (st !== 'new,learning,known') {
  console.log(`✗ статусы: ${st}`);
  plokho += 1;
}
const por = poryadokKolody(['a', 'b', 'c'], {
  a: { korobka: 3, kogda: 1 },
  b: { korobka: 1, kogda: 5 },
}).join('');
if (por !== 'bca' && por !== 'cba') {
  console.log(`✗ порядок колоды: ${por}`);
  plokho += 1;
}
console.log(plokho === 0 ? '\nВсе проверки схем №18 пройдены.' : `\nПровалов: ${plokho}`);
process.exit(plokho === 0 ? 0 : 1);
