#!/usr/bin/env node
/* scripts/check-naibolshee.mjs — самотест раздела «Наибольшее и
   наименьшее значение функции» (номер хранения 21; в ЕГЭ-2027 —
   задание 12).

   Запуск: pnpm test:naibolshee [--n 300]

   1. Каждый прототип: n случайных задач. Ответ пересчитан независимо —
      перебором по самой функции (точка экстремума или наибольшее /
      наименьшее значение на отрезке); формула на экране вычислена прямо
      из TeX и совпадает с функцией расчёта; ответ годится для бланка;
      в TeX нет «+-», «1x», NaN.
   2. Каталог тренажёра (по 20 задач на тип) и примеры «О задании».
   3. Опорные задачи: по десять в блоке, ответ сходится с независимым
      пересчётом.
   4. Классификация: у каждого вида функции есть прототипы, у каждого
      прототипа — «Где теряют балл» и блок опорных задач; три вопроса
      (точка, значение на отрезке, значение без отрезка) встречаются. */

import { requireSrc } from './lib/load-ts.mjs';

const args = process.argv.slice(2);
const n = args.includes('--n') ? Number(args[args.indexOf('--n') + 1]) : 300;

const S = requireSrc('lib/zadanie21/selftest');
const { PROTOTYPES } = requireSrc('lib/zadanie21/prototypes');
const { GRUPPY21, prototypesOfGruppa } = requireSrc('lib/zadanie21/gruppy');
const { BLOK_TIPA21, BLOKI_OPORNYH21 } = requireSrc('lib/zadanie21/opornye');
const { TIPY21_OPASNO } = requireSrc('content/naibolshee21');

const oshibki = [];
const sluchaynye = S.selftest(n);
oshibki.push(...sluchaynye.oshibki);
const katalog = S.selftestKataloga();
oshibki.push(...katalog);
const opornye = S.selftestOpornyh();
oshibki.push(...opornye);

const klass = [];
for (const g of GRUPPY21) {
  if (prototypesOfGruppa(g.id).length === 0) klass.push(`у группы «${g.title}» нет прототипов`);
}
for (const p of PROTOTYPES) {
  if (!TIPY21_OPASNO[p.id]) klass.push(`${p.id}: нет «Где теряют балл»`);
  const blok = BLOK_TIPA21[p.id];
  if (blok === undefined || !BLOKI_OPORNYH21.some((b) => b.slug === blok)) {
    klass.push(`${p.id}: нет блока опорных задач`);
  }
  if (sluchaynye.poProto[p.id] < 5)
    klass.push(`${p.id}: мало разных ответов — ${sluchaynye.poProto[p.id]}`);
}
for (const v of ['A', 'B', 'V']) {
  if (!PROTOTYPES.some((p) => p.vopros === v)) klass.push(`нет прототипов с вопросом ${v}`);
}
for (const k of klass) oshibki.push({ proto: '—', seed: '', chto: k });

if (oshibki.length > 0) {
  console.error(`Наибольшее и наименьшее значение: ошибок — ${oshibki.length}:\n`);
  for (const o of oshibki.slice(0, 40)) console.error(`  ✗ ${o.proto} ${o.seed}: ${o.chto}`);
  if (oshibki.length > 40) console.error(`  … и ещё ${oshibki.length - 40}`);
  process.exit(1);
}
const zadachOp = BLOKI_OPORNYH21.reduce((s, b) => s + b.zadachi.length, 0);
console.log(
  `Наибольшее и наименьшее значение: ${PROTOTYPES.length} прототипов × ${n} случайных задач, ` +
    `каталог тренажёра и примеры, ${zadachOp} опорных задач — всё сходится ` +
    `(проверок ${sluchaynye.proverok + PROTOTYPES.length * 21 + zadachOp}).`,
);
