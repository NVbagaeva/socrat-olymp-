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

import fs from 'node:fs';
import { requireSrc } from './lib/load-ts.mjs';

const H = requireSrc('lib/zhivye/hod.ts');
const P = requireSrc('lib/zhivye/proizvodnaya8.ts');
const T8 = requireSrc('content/zhivye8.ts');
const K6 = requireSrc('lib/zhivye/krug6.ts');
const TRIG = requireSrc('lib/zadanie7/trig.ts');
const T6 = requireSrc('content/zhivye6.ts');
const K13 = requireSrc('lib/zhivye/krug13.ts');
const T13 = requireSrc('content/zhivye13.ts');
const P18 = requireSrc('lib/zhivye/parametr18.ts');
const Z19 = requireSrc('lib/zadanie19/zhivye.ts');
const T18 = requireSrc('content/zhivye18.ts');
const T11 = requireSrc('content/zhivye11.ts');
const Z15 = requireSrc('lib/zhivye/znaki15.ts');
const T15 = requireSrc('content/zhivye15.ts');

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

/* ── №13: угол и деление окружности ── */
progon(K13.HOD_UGLA, '№13 угол');
check(K13.UGOL_MAX === 13 / 3, '№13: путь до 13π/3');
for (let k = 0; k <= 52; k += 1) {
  const x = k / 12;
  const ex = K13.tochno(x);
  const tablichnyy = k % 2 === 0 || k % 3 === 0;
  check(
    (ex !== null) === tablichnyy,
    `№13: точные значения на ${k}π/12 — ${tablichnyy ? 'есть' : 'нет'}`,
  );
}
const ob = K13.oboroty(13 / 3);
check(ob.n === 2 && Math.abs(ob.ostatok - 1 / 3) < 1e-9, '№13: 13π/3 = 4π + π/3');
for (const m of K13.MAKETY) {
  progon(K13.hodMaketa(m), `№13 деление ${m.id}`);
  check(
    T13.DELENIE13.makety[m.id].shagi.length === m.shagi.length,
    `№13 ${m.id}: текст на каждый шаг`,
  );
  let prev = -1;
  for (let i = 0; i <= (m.shagi.length - 1) * 20; i += 1) {
    const d = K13.duga(m, i / 20);
    check(d >= prev - 1e-12, `№13 ${m.id}: дуга не убывает`);
    prev = d;
  }
  for (let i = 0; i < m.shagi.length; i += 1) {
    check(
      Math.abs(K13.duga(m, i) - K13.konecShaga(m, i)) < 1e-12,
      `№13 ${m.id}: на шаге ${i} дуга до последней точки`,
    );
  }
  const vse = K13.vidnyeTochki(m, m.shagi.length - 1);
  const nado = m.fon.length + m.shagi.reduce((s, x) => s + x.tochki.length, 0);
  check(vse.length === nado, `№13 ${m.id}: к концу видны все точки`);
  for (const {
    tochka: [a, b],
  } of vse) {
    const shag = 2 / m.delenie;
    check(
      Math.abs(a / b / shag - Math.round(a / b / shag)) < 1e-9,
      `№13 ${m.id}: точка ${a}/${b}π на делении`,
    );
  }
}
check(
  K13.ugolText(4, 6) === '2π/3' && K13.ugolText(2, 1) === '2π' && K13.ugolText(1, 2) === 'π/2',
  '№13: подписи углов',
);

/* ── №18: параметр ── */
{
  const idy = [
    ...fs
      .readFileSync(new URL('../src/lib/zadanie19/zhivye.ts', import.meta.url), 'utf8')
      .matchAll(/^  '(m\d\d-r\d)':/gm),
  ].map((m) => m[1]);
  check(idy.length >= 20, `№18: описаний живых рисунков ${idy.length}`);
  for (const id of idy) {
    const z = Z19.zhivoy19(id);
    check(z !== undefined, `№18 ${id}: описание есть`);
    if (z === undefined) continue;
    const o = P18.hodParametra(z);
    progon(o, `№18 ${id}`);
    for (const x of z.osobye) {
      const u = P18.uIzA(z, x.a);
      check(Math.abs(P18.aIzU(z, u) - x.a) < 1e-9, `№18 ${id}: особое ${x.tex} на шкале точно`);
      check(P18.naSetke(z, x.a) === x.a, `№18 ${id}: особое ${x.tex} не сдвигается сеткой`);
    }
    const ln = P18.lenta(z);
    if (z.resheniy === undefined) {
      check(ln === null, `№18 ${id}: без числа решений ленты нет`);
      continue;
    }
    check(
      ln !== null && ln.kuski[0].ot === 0 && ln.kuski.at(-1).do === 1,
      `№18 ${id}: лента от начала до конца`,
    );
    for (let i = 1; i < ln.kuski.length; i += 1) {
      check(
        ln.kuski[i].ot === ln.kuski[i - 1].do && ln.kuski[i].n !== ln.kuski[i - 1].n,
        `№18 ${id}: куски ленты стык в стык и разные`,
      );
    }
    for (const t of ln.tochki) {
      const x = z.osobye.find((y) => Math.abs(P18.uIzA(z, y.a) - t.u) < 1e-12);
      check(
        x !== undefined && z.resheniy(x.a) === t.n,
        `№18 ${id}: точка ленты — особое значение с верным числом решений`,
      );
    }
  }
}

/* ── №11: экскурсии живых графиков ── */
{
  const nach = [
    ['парабола', T11.KADRY_PARABOLY, { a: 2, c: 0 }],
    ['тригонометрия', T11.KADRY_TRIG, { fn: 'cos', a: 2, b: 0 }],
    ['логарифм', T11.KADRY_LOG, { baseIndex: 3, b: 0, kIndex: 1, mode: 'y', mirror: false }],
    ['показательная', T11.KADRY_EXP, { baseIndex: 3, b: 0, kIndex: 1, mode: 'y' }],
  ];
  for (const [imya, kadry, s0] of nach) {
    check(kadry.length >= 5, `№11 ${imya}: кадров ${kadry.length}`);
    check(
      JSON.stringify(kadry[0].s) === JSON.stringify(s0),
      `№11 ${imya}: первый кадр — начальные значения ползунков`,
    );
    check(
      kadry.every((k) => /\$/.test(k.tex)),
      `№11 ${imya}: у каждого кадра пояснение с формулой`,
    );
  }
  for (const k of [...T11.KADRY_LOG, ...T11.KADRY_EXP]) {
    check(
      k.s.baseIndex >= 0 && k.s.baseIndex <= 5 && k.s.kIndex >= 0 && k.s.kIndex <= 3,
      '№11: индексы основания и k в пределах ползунков',
    );
  }
  for (let u = 0; u <= 1; u += 0.01) {
    const s = T11.smeshatTrig({ fn: 'cos', a: 1, b: 0 }, { fn: 'cos', a: -1, b: 0 }, u);
    check(Math.abs(s.a) >= 0.1 - 1e-12, '№11: размах тригонометрии не проходит через 0');
  }
}

/* ── №15: знаки произведения ── */
{
  const ozhid = {
    tri: '(-2;\\,1)\\cup(4;\\,+\\infty)',
    kvadrat: '(1;\\,3)\\cup(3;\\,+\\infty)',
    nestrogoe: '\\{-1\\}\\cup[2;\\,4]',
  };
  for (const p of T15.PRIMERY_15) {
    check(
      Z15.otvetTex(Z15.otvet(p)) === ozhid[p.id],
      `№15 ${p.id}: ответ ${Z15.otvetTex(Z15.otvet(p))}`,
    );
    const { xMin, xMax } = Z15.granicy(p);
    for (let x = xMin; x <= xMax; x += 0.013) {
      const f = Z15.znachenie(p, x);
      const z = Z15.znakProizvedeniya(p, x);
      if (Math.abs(f) > 1e-9) check(Math.sign(f) === z, `№15 ${p.id}: знак в x=${x.toFixed(3)}`);
      const m = p.mnozhiteli;
      check(
        m.reduce((s, q) => s * Z15.znakMnozhitelya(q, x), 1) === z,
        `№15 ${p.id}: знак = произведение знаков`,
      );
      const v = Z15.vysotaKrivoy(p, x, Z15.masshtabKrivoy(p));
      check(
        Math.abs(v) < 1 && (Math.abs(f) < 1e-9 || Math.sign(v) === Math.sign(f)),
        `№15 ${p.id}: кривая в рамке и того же знака`,
      );
    }
    const o = Z15.hodZnakov(p);
    check(
      JSON.stringify(o.ostanovki) === JSON.stringify(Z15.nuli(p).map((z) => z.a - xMin)),
      `№15 ${p.id}: остановки — на нулях`,
    );
    check(
      o.ostanovki.every((s) => s > 0 && s < o.tMax),
      `№15 ${p.id}: остановки внутри шкалы`,
    );
  }
}

/* ── 3. Тексты ── */
{
  const vse = JSON.stringify([T8, T6, T13, T18, T11, T15], (k, val) =>
    typeof val === 'function' ? String(val) : val,
  );
  check(!/(^|[^а-яё])(мы|нам|нас|наш)([^а-яё]|$)/i.test(vse), '№8: в текстах нет «мы»');
}

if (failures.length > 0) {
  console.error(`✗ ${failures.length} из ${checks} проверок:`);
  for (const f of failures.slice(0, 30)) console.error('  ' + f);
  process.exit(1);
}
console.log(`✓ Живые сцены: ${checks} проверок пройдено.`);
