#!/usr/bin/env node
/* scripts/check-raspad-10.mjs — модель сцены «Распад изотопа»
   (lib/zadanie10/raspad.ts, теория прикладных задач, раздел
   «Показательные и логарифмические зависимости»).

   Без браузера и сборки:
     1. математика: m(t) = 16 · 2^(−t/7); через k периодов масса 16 / 2^k;
        для каждой целевой массы ответ k · 7 мин и шаги решения сходятся;
        по умолчанию 1 мг → 28 мин (задача ФИПИ);
     2. ядра: 64 штуки, на разных местах; через kT живы ровно 64 / 2^k,
        живых в любой момент не больше, чем по формуле массы, округлённой
        вверх (картинка не расходится с графиком); одинаковы при каждом
        вызове (сервер и браузер);
     3. разметка при ширинах 343–916 px: ядра внутри пробирки и не
        слипаются, столбик между пробиркой и графиком, деления оси t не
        слипаются, подпись ответа помещается, легенда не задевает кривую;
     4. ход времени: остановки ровно на 7, 14, 21, 28 и 35 мин, плавно;
     5. тексты без «мы».

   Запуск: node scripts/check-raspad-10.mjs */

import { requireSrc } from './lib/load-ts.mjs';

const R = requireSrc('lib/zadanie10/raspad.ts');
const { RASPAD10: T } = requireSrc('content/zhivye10.ts');

const failures = [];
let checks = 0;
function check(ok, what) {
  checks += 1;
  if (!ok) failures.push(what);
}
const blizko = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;
const w = (text) => R.shirinaPriblizitelno(text, 13) * 1.05;

/* ── 1. Математика ── */
check(R.M0 === 16 && R.PERIOD === 7 && R.T_MAX === 35, 'm₀ = 16 мг, T = 7 мин, показ до 35 мин');
for (let k = 0; k <= 5; k += 1)
  check(blizko(R.m(k * 7), 16 / 2 ** k), `m(${k * 7}) = ${16 / 2 ** k}`);
check(R.CEL_DEFAULT === 1 && R.otvet(1).t === 28, 'по умолчанию 1 мг → 28 мин');
for (const cel of R.CELI) {
  const o = R.otvet(cel);
  check(
    blizko(R.m(o.t), cel) && o.raz === 2 ** o.k && o.t === 7 * o.k,
    `ответ для ${cel} мг: ${o.t} мин`,
  );
  const shagi = T.shagi(R.ruTex(cel, 1), o.raz, o.k, o.t);
  check(
    shagi.every((s) => !/NaN|undefined/.test(s)),
    `шаги без мусора для ${cel} мг`,
  );
  check(shagi[3].includes(`=${o.t}$`), `ответ в решении для ${cel} мг`);
  check(!shagi[1].includes('\\dfrac{1}{16}=\\dfrac{1}{16}'), `нет повтора дроби для ${cel} мг`);
}

/* ── 2. Ядра ── */
const ya = R.yadra();
check(ya.length === 64, '64 ядра');
check(new Set(ya.map((y) => y.n)).size === 64, 'у каждого ядра своё место');
check(JSON.stringify(R.yadra()) === JSON.stringify(ya), 'ядра одинаковы при каждом вызове');
for (let k = 0; k <= 5; k += 1)
  check(R.zhivyh(ya, k * 7) === 64 / 2 ** k, `через ${k}T живы ${64 / 2 ** k}`);
for (let i = 0; i <= 350; i += 1) {
  const t = i / 10;
  const n = R.zhivyh(ya, t);
  const poFormule = R.m(t) / R.MG_NA_YADRO;
  check(
    Math.abs(n - poFormule) <= 1,
    `живых ядер ${n} ≈ по формуле ${poFormule.toFixed(2)} при t = ${t}`,
  );
}

/* ── 3. Разметка ── */
for (const W of [343, 400, 520, 600, 760, 916]) {
  const r = R.razmetka(W);
  const mesta = ya.map((y) => R.mestoYadra(r, y));
  check(
    mesta.every(
      (p) =>
        p.x - p.rad >= r.px0 + 2 &&
        p.x + p.rad <= r.px0 + r.pw - 2 &&
        p.y - p.rad >= r.py0 + 2 &&
        p.y + p.rad <= r.py1,
    ),
    `ядра внутри пробирки при ширине ${W}`,
  );
  /* Зазор между ядрами с учётом дрожания ±0,8 px. */
  check(r.shag - 2 * mesta[0].rad - 1.6 >= 2, `ядра не слипаются при ширине ${W}`);
  check(r.py0 - 8 - 26 >= 0, `подпись счётчика над пробиркой в сцене при ширине ${W}`);
  check(
    r.px0 + r.pw < r.xStolbik - 6 && r.xStolbik + 6 < r.xRazdel && r.xRazdel < r.gx0 - 20,
    `пробирка, столбик и график по порядку при ширине ${W}`,
  );
  check(R.xT(r, R.T_MAX) <= r.gx1, `кривая не выходит за ось при ширине ${W}`);
  for (let k = 1; k <= 5; k += 1) {
    const dx = R.xT(r, k * 7) - R.xT(r, (k - 1) * 7);
    check(
      dx >= (w(String(k * 7)) + w(String((k - 1) * 7))) / 2 + 4,
      `деления оси t не слипаются при ширине ${W}`,
    );
  }
  for (const cel of R.CELI) {
    const lo = T.podpisOtvet(String(R.otvet(cel).t));
    check(w(lo) + 14 <= W - r.pole - r.xRazdel, `подпись ответа помещается: W=${W}, ${cel} мг`);
    const lw = w(T.podpisCel(R.ru(cel, 1))) + 40;
    const xL = r.gx1 - lw;
    const yL = R.yM(r, R.M0) + 2 + 11;
    for (let i = 0; i <= 200; i += 1) {
      const t = (R.T_MAX * i) / 200;
      const x = R.xT(r, t);
      if (x >= xL - 4 && x <= r.gx1)
        check(R.yM(r, R.m(t)) > yL + 3, `легенда не на кривой: W=${W}, t=${t}`);
    }
  }
}

/* ── 4. Ход времени ── */
{
  let t = 0;
  let start = 0;
  let prev = 0;
  let skachok = 0;
  let kadrov = 0;
  const ostanovki = [];
  while (t < R.T_MAX && kadrov < 20000) {
    const stop = R.sleduyushayaOstanovka(t);
    const nov = R.shagVremeni(1 / 60, 1, t, start, stop);
    if (kadrov > 0) skachok = Math.max(skachok, Math.abs(nov - t - prev));
    prev = nov - t;
    t = nov;
    kadrov += 1;
    if (t >= stop) {
      ostanovki.push(t);
      start = t;
      prev = 0;
    }
  }
  check(
    JSON.stringify(ostanovki) === JSON.stringify([7, 14, 21, 28, 35]),
    `остановки на периодах: ${ostanovki}`,
  );
  check(skachok <= (1 / 60 / R.SEK_NA_MIN) * 0.6, 'скорость меняется плавно');
  check(
    kadrov / 60 > 8 && kadrov / 60 < 20,
    `показ при ×1 длится разумно: ${(kadrov / 60).toFixed(1)} с без пауз`,
  );
}

/* ── 5. Тексты ── */
{
  const vse = JSON.stringify(T, (k, val) => (typeof val === 'function' ? String(val) : val));
  check(!/(^|[^а-яё])(мы|нам|нас|наш)([^а-яё]|$)/i.test(vse), 'в текстах нет «мы»');
  check(
    R.raz(1) === 'раз' && R.raz(2) === 'раза' && R.raz(4) === 'раза' && R.raz(5) === 'раз',
    'склонение «раз»',
  );
}

if (failures.length > 0) {
  console.error(`✗ ${failures.length} из ${checks} проверок:`);
  for (const f of failures.slice(0, 30)) console.error('  ' + f);
  process.exit(1);
}
console.log(`✓ Сцена «Распад изотопа»: ${checks} проверок пройдено.`);
