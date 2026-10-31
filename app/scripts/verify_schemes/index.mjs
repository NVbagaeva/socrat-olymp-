#!/usr/bin/env node
/* scripts/verify_schemes/index.mjs — все проверки ключевых схем №18.

   Каждая схема — свой файл с proverit(N): N случайных невырожденных
   конфигураций (по умолчанию 1000), численная проверка каждого
   следствия и шага доказательства, плюс экранная раскладка. Факт,
   который не прошёл проверку, не публикуется: ненулевой код возврата.

   Плюс механика коробок Лейтнера (lib/zadanie18/progress).

   Запуск: pnpm test:skhemy-18 [N] */

import { requireSrc } from '../lib/load-ts.mjs';
import { zerno } from './obshchee.mjs';
import { proverit as bissektrisa } from './bissektrisa.mjs';
import { proverit as kasatelnye } from './kasatelnye.mjs';
import { proverit as mediana } from './mediana.mjs';
import { proverit as menelay } from './menelay.mjs';
import { proverit as stepenTochki } from './stepenTochki.mjs';
import { proverit as trapecii } from './trapecii.mjs';
import { proverit as ploshchadi } from './ploshchadi.mjs';
import { proverit as pryamyeUgly } from './pryamyeUgly.mjs';
import { proverit as sredlin } from './sredlin.mjs';
import { proverit as trezubec } from './trezubec.mjs';
import { proverit as uglyDugi } from './uglyDugi.mjs';
import { proverit as vpisannyy } from './vpisannyy.mjs';
import { proverit as ravnyeUgly } from './ravnyeUgly.mjs';
import { proverit as sekushchie } from './sekushchie.mjs';
import { proverit as vysoty } from './vysoty.mjs';

const N = Number(process.argv[2] ?? 1000);
let plokho = 0;
for (const proverit of [
  vysoty,
  bissektrisa,
  mediana,
  sekushchie,
  ravnyeUgly,
  pryamyeUgly,
  trezubec,
  uglyDugi,
  vpisannyy,
  sredlin,
  kasatelnye,
  trapecii,
  menelay,
  ploshchadi,
  stepenTochki,
]) {
  plokho += proverit(N).plokho;
}

/* Тексты и чертежи согласованы: у каждой собранной схемы есть живой
   чертёж, каждая группа подсветки из следствий и шагов доказательства
   есть у элементов чертежа, шаги построения подписаны. */
const { SOBRANNYE } = requireSrc('content/zadanie18/spisok');
const { zhivayaSkhema18 } = requireSrc('lib/zadanie18/skhemy');
console.log('\nТексты ↔ чертежи');
for (const s of SOBRANNYE) {
  const z = zhivayaSkhema18(s.id);
  if (z === undefined) {
    console.log(`  ✗ ${s.id}: нет живого чертежа`);
    plokho += 1;
    continue;
  }
  const est = new Set();
  const rnd = zerno(7);
  for (const t of [z.nachalo, ...Array.from({ length: 60 }, () => z.sluchaynaya(rnd))]) {
    for (const el of z.postroit(t).elementy) for (const g of el.gruppy ?? []) est.add(g);
  }
  const nuzhny = [...s.sledstviya, ...s.dokazatelstvo].flatMap((x) => x.gruppy);
  const net = [...new Set(nuzhny)].filter((g) => !est.has(g));
  const pustye = [...s.sledstviya, ...s.dokazatelstvo].filter((x) => x.gruppy.length === 0).length;
  const ok = net.length === 0 && pustye === 0 && z.shagi.length > 0;
  console.log(
    `  ${ok ? '✓' : '✗'} ${s.no}. ${s.nazvanie}${net.length ? ` — нет групп: ${net.join(', ')}` : ''}${pustye ? ` — пунктов без подсветки: ${pustye}` : ''}`,
  );
  if (!ok) plokho += 1;
}

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
