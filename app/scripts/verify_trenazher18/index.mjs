#!/usr/bin/env node
/* scripts/verify_trenazher18/index.mjs — проверка задач тренажёра №18.

   Для каждой задачи банка (content/zadanie18/trenazher):
     • ответ пункта б) из текста (TeX) совпадает с ответом, вычисленным
       по данным б) в координатах — фигура строится здесь заново, без
       кода сайта; где ответ не должен зависеть от остальных параметров
       фигуры, она строится в нескольких формах;
     • поле ответа (lib/zadanie18/otvet.ts) принимает сам ответ и его
       равносильные записи (2√3, 2sqrt3, 2sqrt(3), 3/2, 1,5, 1.5) и не
       принимает чужое число;
     • исходное положение чертежа — это данные пункта б), и ответ,
       посчитанный по его точкам, тот же;
     • утверждение а) — на N случайных фигурах, построенных здесь, и на
       N случайных положениях чертежа (по умолчанию N = 1000);
     • экранная раскладка чертежа (нет NaN, точки в кадре) при подсветке
       каждого шага;
     • тексты ↔ чертёж: у каждого шага есть подсветка и все её группы
       есть на чертеже; «Какие схемы здесь» ведут на собранные схемы.
   И по банку: 24 задачи, по 4 на тему, в каждой теме есть разминка и
   повышенный уровень; id и условия не совпадают с опорными задачами.

   Факт, который не прошёл проверку, — ненулевой код возврата.

   Запуск: pnpm test:trenazher-18 [N] */

import { requireSrc } from '../lib/load-ts.mjs';
import { blizko, proveritEkran, schetchik, texChislo, zerno } from './obshchee.mjs';
import { ZADACHI as KASATELNYE } from './kasatelnye.mjs';
import { ZADACHI as OKRUZHNOST } from './okruzhnost.mjs';
import { ZADACHI as OTNOSHENIYA } from './otnosheniya.mjs';
import { ZADACHI as PLOSHCHADI } from './ploshchadi.mjs';
import { ZADACHI as TRAPECIYA } from './trapeciya.mjs';
import { ZADACHI as TREUGOLNIK } from './treugolnik.mjs';

const N = Number(process.argv[2] ?? 1000);
const PROVERKI = [
  ...TREUGOLNIK,
  ...OKRUZHNOST,
  ...KASATELNYE,
  ...TRAPECIYA,
  ...OTNOSHENIYA,
  ...PLOSHCHADI,
];

const { ZADACHI_18, UROVNI_18 } = requireSrc('content/zadanie18/trenazher/index');
const { OPORNYE_18 } = requireSrc('content/zadanie18/opornye/index');
const { scenaTrenazhera18 } = requireSrc('lib/zadanie18/trenazher/index');
const { proverit18, chisloOtveta18 } = requireSrc('lib/zadanie18/otvet');
const { SOBRANNYE } = requireSrc('content/zadanie18/spisok');
const { GRUPPY_18 } = requireSrc('content/zadanie18/tipy');

let plokho = 0;
let tesnoVsego = 0;
const svodka = [];

/* ── Банк целиком ─────────────────────────────────────────────── */

const bank = schetchik('Банк тренажёра №18');
bank.fakt('в банке 24 задачи', ZADACHI_18.length === 24, `задач ${ZADACHI_18.length}`);
bank.fakt(
  'у каждой задачи своя проверка, и наоборот',
  ZADACHI_18.length === PROVERKI.length &&
    ZADACHI_18.every((z) => PROVERKI.some((p) => p.id === z.id)),
  `задач ${ZADACHI_18.length}, проверок ${PROVERKI.length}`,
);
bank.fakt(
  'номера идут подряд с 1, id не повторяются',
  ZADACHI_18.every((z, i) => z.no === i + 1) &&
    new Set(ZADACHI_18.map((z) => z.id)).size === ZADACHI_18.length,
);
const poryadok = GRUPPY_18.map((g) => g.id);
bank.fakt(
  'задачи идут по темам ключевых схем',
  ZADACHI_18.every(
    (z, i) => i === 0 || poryadok.indexOf(z.gruppa) >= poryadok.indexOf(ZADACHI_18[i - 1].gruppa),
  ),
);
for (const g of GRUPPY_18) {
  const v = ZADACHI_18.filter((z) => z.gruppa === g.id);
  bank.fakt(
    'по 4 задачи на тему, в теме есть разминка, ЕГЭ и повышенный',
    v.length === 4 && Object.keys(UROVNI_18).every((u) => v.some((z) => z.uroven === u)),
    `${g.title}: ${v.map((z) => z.uroven).join(', ')}`,
  );
}
const opornyeId = new Set(OPORNYE_18.map((o) => o.id));
const opornyeUsloviya = new Set(OPORNYE_18.map((o) => `${o.uslovie}|${o.a}|${o.b}`));
bank.fakt(
  'задачи не повторяют опорные (id и условия)',
  ZADACHI_18.every(
    (z) => !opornyeId.has(z.id) && !opornyeUsloviya.has(`${z.uslovie}|${z.a}|${z.b}`),
  ),
);
bank.fakt(
  'пункт а) — «Докажите», пункт б) — «Найдите»',
  ZADACHI_18.every((z) => z.a.startsWith('Докажите') && z.b.startsWith('Найдите')),
);

/* Разбор записи ответа: равносильные записи одного числа. */
const ZAPISI = [
  ['2√3', 2 * Math.sqrt(3)],
  ['2sqrt3', 2 * Math.sqrt(3)],
  ['2 sqrt(3)', 2 * Math.sqrt(3)],
  ['2*sqrt(3)', 2 * Math.sqrt(3)],
  ['2·√3', 2 * Math.sqrt(3)],
  ['\\sqrt{12}', 2 * Math.sqrt(3)],
  ['√12', 2 * Math.sqrt(3)],
  ['4/3', 4 / 3],
  ['\\dfrac43', 4 / 3],
  ['1,5', 1.5],
  ['1.5', 1.5],
  ['3/2', 1.5],
  ['9{,}6', 9.6],
  ['48/5', 9.6],
  ['−4', -4],
  ['30°', 30],
  ['4√3/3', (4 * Math.sqrt(3)) / 3],
  ['(4√3)/3', (4 * Math.sqrt(3)) / 3],
];
for (const [z, x] of ZAPISI) {
  const r = chisloOtveta18(z);
  bank.fakt(
    'поле ответа: равносильные записи разбираются в то же число',
    r !== null && blizko(r, x, 1e-12),
    `${z} → ${r}`,
  );
}
for (const z of ['', 'abc', '2√', '1/0', 'x']) {
  bank.fakt(
    'поле ответа: не число — не разбирается',
    chisloOtveta18(z) === null,
    `«${z}» → ${chisloOtveta18(z)}`,
  );
}
plokho += bank.itog();

/** Равносильные записи ответа, как их набрал бы ученик. */
function zapisiOtveta(tex, x) {
  const s = tex.slice(1, -1);
  const out = [s];
  if (Number.isInteger(x)) out.push(String(x));
  const des = Math.round(x * 1e6) / 1e6;
  if (blizko(des, x, 1e-12) && !Number.isInteger(x))
    out.push(String(des), String(des).replace('.', ','));
  const frac = /^\\dfrac\{?(\d+)\}?\{?(\d+)\}?$/.exec(s);
  if (frac) out.push(`${frac[1]}/${frac[2]}`);
  const koren = /^(\d*)\\sqrt\{?(\d+)\}?$/.exec(s);
  if (koren) {
    const m = koren[1];
    out.push(`${m}√${koren[2]}`, `${m}sqrt${koren[2]}`, `${m}sqrt(${koren[2]})`);
  }
  return out;
}

/* ── Каждая задача ────────────────────────────────────────────── */

for (const z of ZADACHI_18) {
  const pr = PROVERKI.find((p) => p.id === z.id);
  const sc = scenaTrenazhera18(z.id);
  const sch = schetchik(`№${z.no}. ${z.nazvanie} (${UROVNI_18[z.uroven]})`);
  if (pr === undefined || sc === undefined) {
    sch.fakt('есть проверка и чертёж', false, z.id);
    plokho += sch.itog();
    continue;
  }
  const rnd = zerno(1880 + z.no);

  let otvet = NaN;
  try {
    otvet = texChislo(z.otvet);
  } catch (e) {
    sch.fakt('ответ — число в TeX', false, String(e.message));
  }
  const vychisleno = pr.b(sch, rnd);
  sch.fakt(
    `б) ответ ${z.otvet} = ${vychisleno.toFixed(6)}`,
    blizko(otvet, vychisleno, 1e-9),
    `в тексте ${otvet}, вычислено ${vychisleno}`,
  );
  const zapisi = zapisiOtveta(z.otvet, otvet);
  sch.fakt(
    `поле ответа принимает: ${zapisi.join(' | ')}`,
    zapisi.every((s) => proverit18(s, z.otvet) === 'verno'),
    zapisi.map((s) => `${s} → ${JSON.stringify(proverit18(s, z.otvet))}`).join('; '),
  );
  sch.fakt(
    'поле ответа не принимает соседние числа',
    [otvet + 1, otvet * 1.01, -otvet].every(
      (x) => proverit18(String(x).replace('.', ','), z.otvet) === 'neverno',
    ),
  );

  const poChertezhu = pr.nachalo(sc.nachalo, sch);
  sch.fakt(
    'чертёж: исходное положение — данные б), ответ тот же',
    blizko(otvet, poChertezhu, 1e-9),
    `по чертежу ${poChertezhu}`,
  );

  const shagi = [...z.dokazatelstvo, ...z.reshenieB];
  const lity = [[], ...shagi.map((s) => s.gruppy)];
  let tesno = 0;
  let povtorNachala = 0;
  for (let i = 0; i < N; i += 1) {
    pr.a(rnd, sch);
    const t = sc.sluchaynaya(rnd);
    if (t === sc.nachalo) povtorNachala += 1;
    pr.scena(t, sch);
    if (i % 4 === 0) tesno += proveritEkran(sc, t, rnd, sch, lity[(i / 4) % lity.length]);
  }
  sch.fakt('чертёж: случайное положение находится', povtorNachala === 0, `${povtorNachala} раз`);
  for (const lit of lity) tesno += proveritEkran(sc, sc.nachalo, rnd, sch, lit);
  tesnoVsego += tesno;

  const est = new Set();
  for (const t of [sc.nachalo, ...Array.from({ length: 40 }, () => sc.sluchaynaya(rnd))]) {
    for (const el of sc.postroit(t).elementy) for (const g of el.gruppy ?? []) est.add(g);
  }
  const net = [...new Set(shagi.flatMap((s) => s.gruppy))].filter((g) => !est.has(g));
  sch.fakt(
    'у каждого шага есть подсветка',
    shagi.every((s) => s.gruppy.length > 0),
  );
  sch.fakt('группы подсветки шагов есть на чертеже', net.length === 0, net.join(', '));
  sch.fakt('у чертежа подписаны шаги построения', sc.shagi.length > 0);
  const neSobrany = z.skhemy.filter((s) => !SOBRANNYE.some((x) => x.id === s.id));
  sch.fakt(
    '«Какие схемы здесь» — собранные схемы',
    z.skhemy.length > 0 && neSobrany.length === 0,
    neSobrany.map((s) => s.id).join(', '),
  );
  sch.fakt(
    'есть подсказка, доказательство а) и решение б)',
    z.podskazka.length > 0 && z.dokazatelstvo.length > 0 && z.reshenieB.length > 0,
  );

  plokho += sch.itog();
  if (tesno > 0) console.log(`  подписи в тесноте (предупреждение): ${tesno}`);
  svodka.push(`  ${z.no}. [${UROVNI_18[z.uroven]}] ${z.nazvanie}: ${z.otvet}`);
}

console.log('\nОтветы пунктов б):');
console.log(svodka.join('\n'));
console.log(`Подписи в тесноте всего (предупреждение): ${tesnoVsego}`);
console.log(plokho === 0 ? '\nВсе проверки тренажёра №18 пройдены.' : `\nПровалов: ${plokho}`);
process.exit(plokho === 0 ? 0 : 1);
