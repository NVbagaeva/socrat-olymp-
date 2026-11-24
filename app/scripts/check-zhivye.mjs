#!/usr/bin/env node
/* scripts/check-zhivye.mjs — общий ход времени живых сцен
   (lib/zhivye/hod.ts) и модели сцен на нём (lib/zhivye/*.ts).

   Без браузера и сборки:
     1. ход: для каждой сцены остановки ровно на отметках-снимках и в
        конце, скорость меняется плавно, показ при ×1 длится разумно;
     2. №8 «Понятие производной»: шкала проходится точно (на целых t —
        ровно значения шкалы), между соседями значение монотонно;
        числа таблиц сходятся с формулами (tg β = 1 + Δx/4,
        v_ср = 2 + Δt/2, Δy/Δx = ±1) и стремятся к пределам;
     3. тексты сцен без «мы».

   Запуск: node scripts/check-zhivye.mjs */

import { requireSrc } from './lib/load-ts.mjs';

const H = requireSrc('lib/zhivye/hod.ts');
const P = requireSrc('lib/zhivye/proizvodnaya8.ts');
const T8 = requireSrc('content/zhivye8.ts');
const K6 = requireSrc('lib/zhivye/krug6.ts');
const TRIG = requireSrc('lib/zadanie7/trig.ts');
const T6 = requireSrc('content/zhivye6.ts');

const failures = [];
let checks = 0;
function check(ok, what) {
  checks += 1;
  if (!ok) failures.push(what);
}
const blizko = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;

/* ── 1. Ход времени ── */
function progon(o, imya) {
  let t = 0;
  let start = 0;
  let pokazano = 0;
  let prev = 0;
  let skachok = 0;
  let kadrov = 0;
  const ostanovki = [];
  while (t < o.tMax && kadrov < 50000) {
    const stop = H.sleduyushayaOstanovka(o, t, pokazano);
    const nov = H.shagVremeni(o, 1 / 60, 1, t, start, stop);
    if (kadrov > 0) skachok = Math.max(skachok, Math.abs(nov - t - prev));
    prev = nov - t;
    t = nov;
    kadrov += 1;
    if (t >= stop) {
      ostanovki.push(t);
      pokazano = H.pokazanoDo(o, t);
      start = t;
      prev = 0;
    }
  }
  const nado = [...o.ostanovki, o.tMax];
  check(
    JSON.stringify(ostanovki) === JSON.stringify(nado),
    `${imya}: остановки ${ostanovki} вместо ${nado}`,
  );
  check(skachok <= (1 / 60 / o.sekNaEd) * 0.6, `${imya}: скорость меняется плавно`);
  const sek = kadrov / 60 + o.ostanovki.length * o.sekSnimok;
  check(sek > 4 && sek < 30, `${imya}: показ при ×1 длится ${sek.toFixed(1)} с`);
}

for (const [imya, sc] of [
  ['секущая', P.SEKUSHCHAYA],
  ['скорость', P.SKOROST8],
  ['модуль', P.MODUL8],
]) {
  progon(sc.hod, imya);
  /* ── 2. Шкала ── */
  const sh = sc.shkala;
  for (let i = 0; i < sh.length; i += 1) {
    check(blizko(P.naShkale(sh, i), sh[i]), `${imya}: на t = ${i} ровно ${sh[i]}`);
  }
  for (let i = 0; i < sh.length - 1; i += 1) {
    let prev = P.naShkale(sh, i);
    for (let k = 1; k <= 20; k += 1) {
      const v = P.naShkale(sh, i + k / 20);
      check(v <= prev + 1e-12, `${imya}: между ${sh[i]} и ${sh[i + 1]} значение убывает`);
      prev = v;
    }
  }
}

/* Числа таблиц. */
for (const dx of P.SEKUSHCHAYA.shkala) {
  const r = P.SEKUSHCHAYA.stroka(dx);
  check(blizko(r.tg, 1 + dx / 4) && blizko(r.df / dx, r.tg), `секущая: tg β при Δx = ${dx}`);
}
check(
  Math.abs(P.SEKUSHCHAYA.stroka(0.01).tg - P.SEKUSHCHAYA.tgAlpha) < 0.01,
  'секущая: tg β подходит к tg α = 1',
);
for (const dt of P.SKOROST8.shkala) {
  const r = P.SKOROST8.stroka(dt);
  check(blizko(r.vSr, 2 + dt / 2) && blizko(r.ds / dt, r.vSr), `скорость: v_ср при Δt = ${dt}`);
  check(
    P.SKOROST8.s(P.SKOROST8.t0 + dt) <= P.SKOROST8.dlina,
    `скорость: M₁ на дороге при Δt = ${dt}`,
  );
}
for (const dx of P.MODUL8.shkala) {
  const r = P.MODUL8.stroka(dx);
  check(r.otn === Math.sign(dx), `модуль: Δy/Δx = ${Math.sign(dx)} при Δx = ${dx}`);
}
check(
  P.MODUL8.shkala.findIndex((x) => x < 0) === P.MODUL8.shkala.filter((x) => x > 0).length,
  'модуль: сначала справа, потом слева',
);

/* ── №6: тригонометрический круг ── */
for (const fn of ['sin', 'cos', 'tg']) {
  for (const kod of TRIG.ZNACHENIYA[fn]) {
    const a = TRIG.znachenie(kod);
    for (const v of ['minPol', 'maxOtr']) {
      const k = K6.korni(fn, kod, v);
      const gde = `№6 ${fn} = ${kod}, ${v}`;
      check(k.length >= 2, `${gde}: корни есть`);
      for (const r of k) {
        const x = r.t.n / r.t.m;
        check(x >= -2 - 1e-9 && x <= 2 + 1e-9, `${gde}: корень ${x}π в [−2π; 2π]`);
        check(Math.abs(K6.f(fn, x) - a) < 1e-9, `${gde}: f(${x}π) = a`);
      }
      const n = k.filter((r) => r.nuzhnyy);
      check(n.length === 1, `${gde}: нужный корень один`);
      const xs = k.map((r) => r.t.n / r.t.m);
      const nx = n[0] ? n[0].t.n / n[0].t.m : NaN;
      check(
        v === 'minPol'
          ? nx === Math.min(...xs.filter((x) => x > 0))
          : nx === Math.max(...xs.filter((x) => x < 0)),
        `${gde}: нужный корень верный`,
      );
      /* Все корни на шкале найдены: численно f(x) = a только в них. */
      for (let i = 0; i <= 4000; i += 1) {
        const x = -2 + i / 1000;
        if (Math.abs(K6.f(fn, x) - a) < 1e-4) {
          check(
            xs.some((r) => Math.abs(r - x) < 0.01),
            `${gde}: f = a при x = ${x.toFixed(3)}π — в списке корней`,
          );
        }
      }
      if (fn === 'sin' && kod === '1/2' && v === 'minPol') progon(K6.hodKruga(k), '№6 круг');
    }
  }
}

/* ── 3. Тексты ── */
{
  const vse = JSON.stringify([T8, T6], (k, val) => (typeof val === 'function' ? String(val) : val));
  check(!/(^|[^а-яё])(мы|нам|нас|наш)([^а-яё]|$)/i.test(vse), '№8: в текстах нет «мы»');
}

if (failures.length > 0) {
  console.error(`✗ ${failures.length} из ${checks} проверок:`);
  for (const f of failures.slice(0, 30)) console.error('  ' + f);
  process.exit(1);
}
console.log(`✓ Живые сцены: ${checks} проверок пройдено.`);
