#!/usr/bin/env node
/* scripts/verify_opornye18/index.mjs — проверка опорных задач №18.

   Для каждой задачи:
     • ответ пункта б) из текста задачи (TeX) совпадает с ответом,
       вычисленным по данным б) в координатах — фигура строится здесь
       заново, без кода сайта; где ответ не должен зависеть от
       остальных параметров фигуры, она строится в нескольких формах;
     • исходное положение чертежа — это данные пункта б), и ответ,
       посчитанный по его точкам, тот же;
     • утверждение а) — на N случайных фигурах, построенных здесь, и
       на N случайных положениях чертежа (по умолчанию N = 1000);
     • экранная раскладка чертежа (нет NaN, точки в кадре) при
       подсветке каждого шага решения;
     • тексты ↔ чертёж: у каждого шага есть подсветка, и все её группы
       есть у элементов чертежа; ссылки «Какие схемы здесь» ведут на
       собранные схемы; номера и id согласованы.

   Факт, который не прошёл проверку, — ненулевой код возврата.

   Запуск: pnpm test:opornye-18 [N] */

import { requireSrc } from '../lib/load-ts.mjs';
import { blizko, proveritEkran, schetchik, texChislo, zerno } from './obshchee.mjs';
import { ZADACHI as KASATELNYE } from './kasatelnye.mjs';
import { ZADACHI as OKRUZHNOST } from './okruzhnost.mjs';
import { ZADACHI as OTNOSHENIYA } from './otnosheniya.mjs';
import { ZADACHI as PLOSHCHADI } from './ploshchadi.mjs';
import { ZADACHI as TRAPECIYA } from './trapeciya.mjs';
import { ZADACHI as TREUGOLNIK } from './treugolnik.mjs';
import { ZADACHI as NOVYE } from './novye.mjs';

const N = Number(process.argv[2] ?? 1000);
const PROVERKI = [
  ...TREUGOLNIK,
  ...OKRUZHNOST,
  ...KASATELNYE,
  ...TRAPECIYA,
  ...OTNOSHENIYA,
  ...PLOSHCHADI,
  ...NOVYE,
];

const { OPORNYE_18 } = requireSrc('content/zadanie18/opornye/index');
const { scenaOpornoy18 } = requireSrc('lib/zadanie18/opornye/index');
const { SOBRANNYE } = requireSrc('content/zadanie18/spisok');
const { GRUPPY_18 } = requireSrc('content/zadanie18/tipy');

let plokho = 0;
let tesnoVsego = 0;
const svodka = [];

const obshchie = schetchik('Список опорных задач');
obshchie.fakt(
  'у каждой задачи своя проверка, и наоборот',
  OPORNYE_18.length === PROVERKI.length &&
    OPORNYE_18.every((o) => PROVERKI.some((p) => p.id === o.id)),
  `задач ${OPORNYE_18.length}, проверок ${PROVERKI.length}`,
);
obshchie.fakt(
  'номера идут подряд с 1, id не повторяются',
  OPORNYE_18.every((o, i) => o.no === i + 1) &&
    new Set(OPORNYE_18.map((o) => o.id)).size === OPORNYE_18.length,
);
const poryadokGrupp = GRUPPY_18.map((g) => g.id);
obshchie.fakt(
  'задачи идут по темам ключевых схем, в каждой теме есть задачи',
  OPORNYE_18.every(
    (o, i) =>
      i === 0 || poryadokGrupp.indexOf(o.gruppa) >= poryadokGrupp.indexOf(OPORNYE_18[i - 1].gruppa),
  ) && poryadokGrupp.every((g) => OPORNYE_18.some((o) => o.gruppa === g)),
);
plokho += obshchie.itog();

for (const o of OPORNYE_18) {
  const pr = PROVERKI.find((p) => p.id === o.id);
  const z = scenaOpornoy18(o.id);
  const sch = schetchik(`№${o.no}. ${o.nazvanie}`);
  if (pr === undefined || z === undefined) {
    sch.fakt('есть проверка и чертёж', false, o.id);
    plokho += sch.itog();
    continue;
  }

  /* Ответ из текста. */
  let otvet = NaN;
  try {
    otvet = texChislo(o.otvet);
  } catch (e) {
    sch.fakt('ответ — число в TeX', false, String(e.message));
  }
  const vychisleno = pr.b(sch);
  sch.fakt(
    `б) ответ ${o.otvet} = ${vychisleno.toFixed(6)}`,
    blizko(otvet, vychisleno, 1e-9),
    `в тексте ${otvet}, вычислено ${vychisleno}`,
  );
  const poChertezhu = pr.nachalo(z.nachalo, sch);
  sch.fakt(
    'чертёж: исходное положение — данные б), ответ тот же',
    blizko(otvet, poChertezhu, 1e-9),
    `по чертежу ${poChertezhu}`,
  );
  sch.fakt(
    'чертёж: исходное положение допустимо',
    z.podvizhnye.every((k) => z.ogranichit(k, z.nachalo[k], z.nachalo) !== null),
  );

  /* Утверждение а): свои случайные фигуры и положения чертежа. */
  const rnd = zerno(1800 + o.no);
  const shagi = [...o.reshenieA, ...o.reshenieB];
  const lity = [[], ...shagi.map((s) => s.gruppy)];
  let tesno = 0;
  let povtorNachala = 0;
  for (let i = 0; i < N; i += 1) {
    pr.a(rnd, sch);
    const t = z.sluchaynaya(rnd);
    if (t === z.nachalo) povtorNachala += 1;
    pr.scena(t, sch);
    if (i % 4 === 0) tesno += proveritEkran(z, t, rnd, sch, lity[(i / 4) % lity.length]);
  }
  sch.fakt('чертёж: случайное положение находится', povtorNachala === 0, `${povtorNachala} раз`);
  for (const lit of lity) tesno += proveritEkran(z, z.nachalo, rnd, sch, lit);
  tesnoVsego += tesno;

  /* Тексты ↔ чертёж. */
  const est = new Set();
  for (const t of [z.nachalo, ...Array.from({ length: 40 }, () => z.sluchaynaya(rnd))]) {
    for (const el of z.postroit(t).elementy) for (const g of el.gruppy ?? []) est.add(g);
  }
  const net = [...new Set(shagi.flatMap((s) => s.gruppy))].filter((g) => !est.has(g));
  sch.fakt(
    'у каждого шага решения есть подсветка',
    shagi.every((s) => s.gruppy.length > 0),
  );
  sch.fakt('группы подсветки шагов есть на чертеже', net.length === 0, net.join(', '));
  sch.fakt('у чертежа подписаны шаги построения', z.shagi.length > 0);
  const neSobrany = o.skhemy.filter((s) => !SOBRANNYE.some((x) => x.id === s.id));
  sch.fakt(
    '«Какие схемы здесь» — собранные схемы',
    o.skhemy.length > 0 && neSobrany.length === 0,
    neSobrany.map((s) => s.id).join(', '),
  );
  sch.fakt('решение а) и б) по шагам', o.reshenieA.length > 0 && o.reshenieB.length > 0);

  plokho += sch.itog();
  if (tesno > 0) console.log(`  подписи в тесноте (предупреждение): ${tesno}`);
  svodka.push(`  ${o.no}. ${o.nazvanie}: ${o.otvet}`);
}

console.log('\nОтветы пунктов б):');
console.log(svodka.join('\n'));
console.log(`Подписи в тесноте всего (предупреждение): ${tesnoVsego}`);
console.log(plokho === 0 ? '\nВсе проверки опорных задач №18 пройдены.' : `\nПровалов: ${plokho}`);
process.exit(plokho === 0 ? 0 : 1);
