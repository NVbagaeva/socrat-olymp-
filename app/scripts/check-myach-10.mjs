#!/usr/bin/env node
/* scripts/check-myach-10.mjs — модель сцены «Мяч выше отметки»
   (lib/zadanie10/myach.ts, теория прикладных задач, раздел
   «Квадратные уравнения»).

   Без браузера и сборки:
     1. математика: h(t) = 1,2 + 10t − 5t², вершина 6,2 м при t = 1 с,
        для каждой отметки H корни точные (до сотых), h(t₁) = h(t₂) = H,
        t₂ − t₁ совпадает с шагами решения; по умолчанию H = 6, ответ 0,4 с;
     2. на каждом шаге времени и ширине сцены от 343 до 900 px подписи
        t₁ и t₂ не налезают друг на друга и не выходят за график,
        промежуток помещается; ряды под осью идут по порядку; мяч не
        уходит за верх сцены;
     3. ход времени: остановки ровно на t₁, t₂ и при падении, скорость
        меняется плавно;
     4. тексты без «мы».

   Запуск: node scripts/check-myach-10.mjs */

import { requireSrc } from './lib/load-ts.mjs';

const M = requireSrc('lib/zadanie10/myach.ts');
const { MYACH10: T } = requireSrc('content/zhivye10.ts');

const failures = [];
let checks = 0;
function check(ok, what) {
  checks += 1;
  if (!ok) failures.push(what);
}
const blizko = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;
const w = (text) => M.shirinaPriblizitelno(text, 13) * 1.05;

/* ── 1. Математика ── */
check(blizko(M.h(0), 1.2), 'h(0) = 1,2');
check(blizko(M.T_VERSH, 1) && blizko(M.H_MAX, 6.2), 'вершина 6,2 м при t = 1 с');
check(
  M.T_KON > 2.11 && M.T_KON < 2.12 && blizko(M.h(M.T_KON), 0, 1e-9),
  `падение через ≈ 2,11 с: ${M.T_KON}`,
);
check(M.OTMETKA_DEFAULT === 6, 'по умолчанию H = 6');
{
  const { t1, t2 } = M.korni(6);
  check(t1 === 0.8 && t2 === 1.2, `при H = 6 корни 0,8 и 1,2: ${t1}, ${t2}`);
}
for (const H of M.OTMETKI) {
  const { t1, t2, d } = M.korni(H);
  check(blizko(M.h(t1), H, 1e-9) && blizko(M.h(t2), H, 1e-9), `h(t₁) = h(t₂) = ${H}`);
  check(
    blizko(t1 * 100, Math.round(t1 * 100)) && blizko(t2 * 100, Math.round(t2 * 100)),
    `корни точные при H = ${H}: ${t1}, ${t2}`,
  );
  check(t1 > 0 && t2 < M.T_KON, `корни внутри полёта при H = ${H}`);
  const q = (H - 1.2) / 5;
  check(blizko(Math.sqrt(1 - q), d, 1e-9), `шаг решения √(1 − q) = d при H = ${H}`);
  const shagi = T.shagi(
    M.ruTex(H, 1),
    M.ruTex(H - 1.2),
    M.ruTex(q),
    M.ruTex(1 - q),
    M.ruTex(d),
    M.ruTex(t1),
    M.ruTex(t2),
    M.ruTex(t2 - t1),
  );
  check(
    shagi.every((s) => !/NaN|undefined|e-\d/.test(s)),
    `шаги решения без мусора при H = ${H}`,
  );
  check(shagi[4].includes(`=${M.ruTex(t2 - t1)}$`), `ответ в решении при H = ${H}: ${shagi[4]}`);
}

/* ── 2. Разметка и подписи ── */
for (const W of [343, 400, 520, 600, 760, 916]) {
  const r = M.razmetka(W);
  check(
    r.yDeleniya + 7 <= r.yKorni - 11 &&
      r.yKorni + 11 <= r.yPromezhutok - 11 &&
      r.yPromezhutok + 11 <= r.H,
    `ряды под осью по порядку при ширине ${W}`,
  );
  check(M.yH(r, M.H_MAX) - r.rMyach >= 8, `мяч в вершине не уходит за верх сцены при ширине ${W}`);
  check(r.xMyach + r.rMyach * 2.2 < r.gx0, `мяч со свечением левее графика при ширине ${W}`);
  check(
    M.xT(r, M.T_KON) + 6 < r.gx1 - w('t, с') + 4 || M.xT(r, M.T_KON) < r.gx1 - 20,
    `конец кривой не под подписью оси t при ширине ${W}`,
  );
  const del = M.deleniyaT(r);
  for (let i = 1; i < del.length; i += 1) {
    const dx = M.xT(r, del[i]) - M.xT(r, del[i - 1]);
    check(
      dx >= (w(M.ru(del[i], 1)) + w(M.ru(del[i - 1], 1))) / 2 + 6,
      `деления оси t не слипаются при ширине ${W}`,
    );
  }
  for (const H of M.OTMETKI) {
    const { t1, t2 } = M.korni(H);
    const l1 = T.podpisT1(M.ru(t1));
    const l2 = T.podpisT2(M.ru(t2));
    const a = { c: M.xT(r, t1), w: w(l1) + 14 };
    const b = { c: M.xT(r, t2), w: w(l2) + 14 };
    const [c1, c2] = M.razvesti(a, b, r.xRazdel, W - r.pole, 6);
    check(c2 - c1 >= (a.w + b.w) / 2 + 5.99, `t₁ и t₂ не налезают: W=${W}, H=${H}`);
    check(
      c1 - a.w / 2 >= r.xRazdel - 0.01 && c2 + b.w / 2 <= W - r.pole + 0.01,
      `t₁ и t₂ в пределах графика: W=${W}, H=${H}`,
    );
    for (let k = 0; k <= 100; k += 1) {
      const t = t1 + ((t2 - t1) * k) / 100;
      const lp = T.podpisPromezhutok(M.ru(t - t1), k === 100);
      check(w(lp) + 14 <= W - r.pole - r.xRazdel, `промежуток помещается: W=${W}, H=${H}`);
    }
    /* Легенда «H = … м» в правом верхнем углу не задевает кривую. */
    const lw = w(T.podpisH(M.ru(H, 1))) + 40;
    const xL = r.gx1 - lw;
    const yL = M.yH(r, M.H_SHKALY) + 2 + 11;
    for (let k = 0; k <= 200; k += 1) {
      const t = (M.T_KON * k) / 200;
      const x = M.xT(r, t);
      if (x >= xL - 4 && x <= r.gx1)
        check(
          M.yH(r, M.h(t)) > yL + 3,
          `легенда H не на кривой: W=${W}, H=${H}, t=${t.toFixed(2)}`,
        );
    }
  }
}

/* ── 3. Ход времени ── */
for (const H of M.OTMETKI) {
  const { t1, t2 } = M.korni(H);
  let t = 0;
  let start = 0;
  let pokazany = 0;
  let prev = 0;
  let skachok = 0;
  let kadrov = 0;
  const ostanovki = [];
  while (t < M.T_KON && kadrov < 20000) {
    const stop = M.sleduyushayaOstanovka(H, t, pokazany);
    const nov = M.shagVremeni(1 / 60, 1, t, start, stop);
    if (kadrov > 0) skachok = Math.max(skachok, Math.abs(nov - t - prev));
    prev = nov - t;
    t = nov;
    kadrov += 1;
    if (t >= stop) {
      ostanovki.push(t);
      if (stop < M.T_KON) {
        pokazany += 1;
        start = t;
        prev = 0;
      }
    }
  }
  check(
    ostanovki.length === 3 &&
      ostanovki[0] === t1 &&
      ostanovki[1] === t2 &&
      ostanovki[2] === M.T_KON,
    `остановки на t₁, t₂ и падении при H = ${H}: ${ostanovki}`,
  );
  const polnyy = 1 / 60 / M.SEK_NA_SEK;
  check(skachok <= polnyy * 0.6, `скорость меняется плавно при H = ${H}`);
  check(
    kadrov / 60 > 4 && kadrov / 60 < 10,
    `показ при ×1 длится разумно при H = ${H}: ${(kadrov / 60).toFixed(1)} с`,
  );
}

/* ── 4. Тексты ── */
{
  const vse = JSON.stringify(T, (k, val) => (typeof val === 'function' ? String(val) : val));
  check(!/(^|[^а-яё])(мы|нам|нас|наш)([^а-яё]|$)/i.test(vse), 'в текстах нет «мы»');
}

if (failures.length > 0) {
  console.error(`✗ ${failures.length} из ${checks} проверок:`);
  for (const f of failures.slice(0, 30)) console.error('  ' + f);
  process.exit(1);
}
console.log(`✓ Сцена «Мяч выше отметки»: ${checks} проверок пройдено.`);
