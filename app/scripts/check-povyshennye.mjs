#!/usr/bin/env node
/* scripts/check-povyshennye.mjs — раздел «Варианты повышенной сложности».

   Запуск: pnpm test:povyshennye [номера вариантов] [--json файл] [--report]

   Для каждого готового варианта (lib/povyshennye/dannye) собираются
   все шесть версий — так же, как их собирает онлайн-режим и лист, — и
   проверяется:

     1. Детерминизм: набор, собранный второй раз, побайтно тот же.
     2. Задача целая: условие, ответ по правилам бланка ЕГЭ, решение
        учителя и разбор ученика; у №4–6 ответ — конечная десятичная
        дробь, у №4 и №5 — строго между 0 и 1; у №13 — целое число.
     3. Сырого TeX в условии и решениях нет (как test:math-markup).
     4. Второй, независимый счёт ответа шаблона сходится с ответом
        (перебор, подстановка корня, численный счёт, бисекция …).
     5. Внутри варианта шесть версий различаются числами у каждого
        задания; среди всех версий раздела нет одинаковых задач.

   --json файл — выгрузка «шаблон, параметры, ответ» для проверки
   sympy (scripts/check_povyshennye.py) — второй способ из ТЗ.
   --report — таблица «вариант — задание — прототип — откуда».

   Ненулевой код возврата — проверка не прошла. */

import fs from 'node:fs';
import { requireSrc } from './lib/load-ts.mjs';
import { findRawTex, visibleTexts } from './lib/math-markup.mjs';

const args = process.argv.slice(2);
const only = args.filter((a, i) => /^\d+$/.test(a) && args[i - 1] !== '--json').map(Number);
const JSON_OUT = args.includes('--json') ? args[args.indexOf('--json') + 1] : null;
const REPORT = args.includes('--report');

const { povSetIz } = requireSrc('lib/povyshennye/set');
const { SHABLONY } = requireSrc('lib/povyshennye/shablony');
const { normalizeAnswer } = requireSrc('lib/variant/online/normalize');
const VER = requireSrc('lib/veroyatnost/povyshennye');
const { PV4_NE_MENEE, PV5_DVE_PARTII } = VER;
const { P03_85, P03_86 } = requireSrc('lib/zadanie3/razdel8/cilindr');
const { P03_90, P03_91 } = requireSrc('lib/zadanie3/razdel8/sfera-konus');
const { P03_74S } = requireSrc('lib/zadanie3/razdel7/povyshennye');
const { prototype: prototype6 } = requireSrc('lib/zadanie6/prototypes');
const PV6 = requireSrc('lib/zadanie6/prototypes/povyshennye');
const { STATISTICHESKOE: STAT4 } = requireSrc('lib/veroyatnost/bank4/statisticheskoe');
const Z7 = requireSrc('lib/zadanie7/prototypes/povyshennye');
const { PV7_KOREN } = Z7;
const VY = requireSrc('lib/vychisleniya/povyshennye');
const { logObratnyy } = VY;
const PR9 = requireSrc('lib/proizvodnaya/povyshennye');
const { maxNaOtrezke } = PR9;
const GR = requireSrc('lib/graph/povyshennye');
const { kLog } = GR;
const VK = requireSrc('lib/vektory/povyshennye');
const { skalyarnoeKombinatsiy } = VK;

let failures = 0;
function fail(where, message) {
  failures += 1;
  if (failures <= 80) console.error(`  ✗ ${where}: ${message}`);
}

const num = (s) => Number(String(s).replace(',', '.').replace('−', '-'));
const close = (a, b) => Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(b));

/* ── Второй счёт по шаблону ─────────────────────────────────────── */

const VTOROY = {
  'z01.ravnobedr-koren': (p) => {
    /* Площадь по координатам вершин: стороны √a, угол 30°. */
    const s = Math.sqrt(p.a);
    const A = [0, 0];
    const B = [s, 0];
    const C = [s * Math.cos(Math.PI / 6), s * Math.sin(Math.PI / 6)];
    return Math.abs((B[0] - A[0]) * (C[1] - A[1]) - (C[0] - A[0]) * (B[1] - A[1])) / 2;
  },
  'z02.skalyar-km': (p) => skalyarnoeKombinatsiy(p).proverka,
  'z03.shar-v-cilindre': (p) => P03_86.poModeli(p),
  'z04.ne-menee': (p) => PV4_NE_MENEE.perebor(p),
  'z05.dve-partii': (p) => PV5_DVE_PARTII.perebor(p),
  'z06.chastoty': (p) => prototype6('P08').pereschet(p),
  'z07.koren': (p) => {
    /* Подстановка корня шаблона в исходное уравнение. */
    const x = PV7_KOREN.solve(p).answer;
    const c = PV7_KOREN.chisla(p);
    return close(c.lhs(x), c.rhs(x)) ? x : NaN;
  },
  'z08.log-obratnyy': (p) => logObratnyy(p).proverka,
  'z09.max-na-otrezke': (p) => maxNaOtrezke(p)?.proverka ?? NaN,
  'z10.vysota': (p) => {
    /* Корни h(t) = H численно, без решателя раздела. */
    const a = -p.g2;
    const b = p.v0;
    const c = p.h0 - p.H;
    const D = b * b - 4 * a * c;
    return Math.abs(Math.sqrt(D) / a);
  },
  'z11.bystryy': (p) => {
    /* Перебор скорости быстрого с шагом 1 км/ч: разница времени — dt минут. */
    for (let v = p.dv + 1; v <= 300; v += 1) {
      if (close(p.S / (v - p.dv) - p.S / v, p.dt / 60)) return v;
    }
    return NaN;
  },
  'z12.k-log': (p) => kLog(p).proverka,
  'z13.dif-summa': (p) => {
    /* Прямой пересчёт по годам в рублях. */
    let dolg = p.S * 1e6;
    const umen = dolg / p.n;
    let vsego = 0;
    for (let i = 0; i < p.n; i += 1) {
      vsego += dolg * (p.r / 100) + umen;
      dolg -= umen;
    }
    return Math.round(vsego * 100) / 100;
  },
};

/** Корень уравнения №7 подстановкой в исходное уравнение (с ОДЗ). */
const podstanovka7 = (proto) => (p) => {
  const x = proto.solve(p).answer;
  const c = proto.chisla(p);
  return close(c.lhs(x), c.rhs(x)) && c.odz(x) ? x : NaN;
};

/** Бисекция возрастающей функции f на [lo; hi]: f(x) = 0. */
function bisekciya(f, lo, hi) {
  for (let i = 0; i < 200; i += 1) {
    const m = (lo + hi) / 2;
    if (f(m) < 0) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
}

/** Угол при вершине по координатам, в градусах. */
function ugol(P, Q, R) {
  const a = Math.atan2(P[1] - Q[1], P[0] - Q[0]);
  const b = Math.atan2(R[1] - Q[1], R[0] - Q[0]);
  let d = Math.abs(a - b) * (180 / Math.PI);
  if (d > 180) d = 360 - d;
  return d;
}

Object.assign(VTOROY, {
  'z01.ravnobedr-150': (p) => {
    /* Площадь по координатам вершин: стороны √a, угол 150°. */
    const s = Math.sqrt(p.a);
    const C = [s * Math.cos((5 * Math.PI) / 6), s * Math.sin((5 * Math.PI) / 6)];
    return Math.abs(s * C[1]) / 2;
  },
  'z01.trapeciya-menshiy': (p) => {
    /* Трапеция по координатам: точка пересечения средней линии с диагональю AC. */
    const h = 3;
    const A = [0, 0];
    const B = [1.3, h];
    const C = [1.3 + Math.min(p.a, p.b), h];
    const D = [Math.max(p.a, p.b), 0];
    const M = [(A[0] + B[0]) / 2, h / 2];
    const N = [(C[0] + D[0]) / 2, h / 2];
    const K = [(A[0] + C[0]) / 2, h / 2];
    return Math.min(K[0] - M[0], N[0] - K[0]);
  },
  'z01.trapeciya-diagonali': (p) => {
    const h = 3;
    const A = [0, 0];
    const B = [1.3, h];
    const C = [1.3 + Math.min(p.a, p.b), h];
    const D = [Math.max(p.a, p.b), 0];
    return Math.hypot((A[0] + C[0] - B[0] - D[0]) / 2, (A[1] + C[1] - B[1] - D[1]) / 2);
  },
  'z01.vneshnie-ugly': (p) => {
    /* Строим треугольник по внутренним углам A и C, угол B меряем. */
    const A = (180 - p.a) * (Math.PI / 180);
    const C = (180 - p.c) * (Math.PI / 180);
    const b = 10;
    const c = (b * Math.sin(C)) / Math.sin(Math.PI - A - C);
    const PA = [0, 0];
    const PC = [b, 0];
    const PB = [c * Math.cos(A), c * Math.sin(A)];
    return Math.round(ugol(PA, PB, PC) * 1e6) / 1e6;
  },
  'z02.dlina-po-risunku': (p) => VK.dlinaKombinatsiiPoRisunku(p).proverka,
  'z02.perpendikulyar': (p) => VK.perpendikulyarNeizvestnaya(p).proverka,
  'z03.cilindr-okolo-shara': (p) => P03_85.poModeli(p),
  'z03.prizma-okolo-cilindra': (p) => P03_74S.poModeli(p),
  'z03.konus-v-share': (p) => P03_91.poModeli(p),
  'z03.shar-okolo-konusa': (p) => P03_90.poModeli(p),
  'z04.bolshe': (p) => VER.PV4_BOLSHE.perebor(p),
  'z04.delitsya': (p) => VER.PV4_DELITSYA.perebor(p),
  'z04.protivopolozhnoe': (p) => VER.PV4_PROTIVOPOLOZHNOE.perebor(p),
  'z05.mezhdu': (p) => VER.PV5_MEZHDU.perebor(p),
  'z05.kost-uslovie': (p) => VER.PV5_KOST_USLOVIE.perebor(p),
  'z06.dispersiya': (p) => prototype6('P14').pereschet(p),
  'z06.otklonenie': (p) => prototype6('P15').pereschet(p),
  'z04.chastota': (p) => VER.PV4_CHASTOTA.perebor(p),
  'z04.sootechestvennik': (p) => VER.PV4_SOOTECHESTVENNIK.perebor(p),
  /* Прототипы банка №4 (p4-20, p4-19): прямой обход партии. */
  'z04.bez-defekta': (p) => STAT4.find((x) => x.id === 'p4-20').perebor(p),
  'z04.ne-podtekaet': (p) => STAT4.find((x) => x.id === 'p4-19').perebor(p),
  'z05.dve-misheni': (p) => VER.PV5_DVE_MISHENI.perebor(p),
  'z05.odin-tsvet': (p) => VER.PV5_ODIN_TSVET.perebor(p),
  'z05.oba-zakonchilis': (p) => VER.PV5_OBA_ZAKONCHILIS.perebor(p),
  'z06.strahovka-tys': (p) => PV6.PV6_STRAHOVKA_TYS.pereschet(p),
  'z06.promezhutok': (p) => prototype6('P11').pereschet(p),
  'z07.log-stepeni': podstanovka7(Z7.PV7_LOG_STEPENI),
  'z07.log-postoronniy': podstanovka7(Z7.PV7_LOG_KVADRAT),
  'z08.log-pryamoy': (p) => VY.logPryamoy(p).proverka,
  'z08.sin-dvoynoy': (p) => VY.sinDvoynogoPrivedenie(p).proverka,
  'z08.stepeni-chastnoe': (p) => VY.stepeniChastnoe(p).proverka,
  'z09.min-na-otrezke': (p) => PR9.minNaOtrezke(p)?.proverka ?? NaN,
  'z09.chislo-na-otrezke': (p) => PR9.chisloNaOtrezke(p)?.proverka ?? NaN,
  'z09.skorost': (p) => PR9.skorostVMoment(p).proverka,
  'z10.adiabata': (p) => Math.round(p.V1 * (p.p1 / p.p2) ** (1 / 1.4) * 1e9) / 1e9,
  'z10.motocikl': (p) => {
    /* Время в часах бисекцией S(t) = S, затем минуты. */
    const tt = bisekciya((t) => p.v0 * t + (p.a * t * t) / 2 - p.S, 0, 50);
    return Math.round(tt * 60 * 1e6) / 1e6;
  },
  'z11.sobstvennaya': (p) => {
    /* Время в пути убывает по x: бисекция на (c; 1000). */
    const x = bisekciya(
      (u) => -(p.S / (u + p.c) + p.S / (u - p.c) - (p.T - p.st)),
      p.c + 1e-9,
      1000,
    );
    return Math.round(x * 1e6) / 1e6;
  },
  'z11.ocheredno': (p) => {
    /* Сделанная к моменту T доля работы — бисекция по T. */
    const dolya = (T) =>
      (Math.max(0, T) + Math.max(0, T - p.d1) + Math.max(0, T - p.d1 - p.d2)) / p.t - 1;
    return Math.round(bisekciya(dolya, 0, 1000) * 1e6) / 1e6;
  },
  'z12.giperbola-pryamaya': (p) => GR.giperbolaPryamaya(p).proverka,
  'z12.koren-koren': (p) => GR.korenKoren(p).proverka,
  'z13.stavka-vklada': (p) => {
    /* Перебор ставки с шагом 0,01 % прямым пересчётом по годам. */
    for (let r = 1; r <= 10000; r += 1) {
      const k = 1 + r / 10000;
      if (Math.abs((p.S * k + p.x) * k - p.Z) < 1e-6) return r / 100;
    }
    return NaN;
  },
  'z13.posledniy-platezh': (p) => {
    /* Годы по очереди: начисление, затем долг на июль. */
    let dolg = p.S * 1e6;
    let plat = 0;
    for (let i = 1; i <= p.n; i += 1) {
      const posle = dolg * (1 + p.r / 100);
      const novyy = i === p.n ? 0 : dolg * (1 - p.q / 100);
      plat = posle - novyy;
      dolg = novyy;
    }
    return Math.round(plat * 100) / 100;
  },
});

/* Партия 2, группа g1: варианты 7–12, №1–3. */
const Z3_2 = requireSrc('lib/zadanie3/razdel2/povyshennye');
const Z3_3 = requireSrc('lib/zadanie3/razdel3/povyshennye');
const Z3_5 = requireSrc('lib/zadanie3/razdel5/povyshennye');
const { P03_70 } = requireSrc('lib/zadanie3/razdel5/dvacilindra');

/** Равнобедренный AC = BC = l с углом A при основании: вершины по координатам. */
function ravnobedr(l, A) {
  return { A: [0, 0], B: [2 * l * Math.cos(A), 0], C: [l * Math.cos(A), l * Math.sin(A)] };
}

/** Основание AC, вершина B, биссектриса AF: F — бисекцией по BC, угол меряем. */
function bissektrisaF(b) {
  const pri = ((180 - b) / 2) * (Math.PI / 180);
  const A = [0, 0];
  const C = [10, 0];
  const B = [5, 5 * Math.tan(pri)];
  /* F на BC: углы BAF и FAC равны. */
  const t = bisekciya(
    (s) => {
      const F = [B[0] + (C[0] - B[0]) * s, B[1] + (C[1] - B[1]) * s];
      return ugol(B, A, F) - ugol(F, A, C);
    },
    0,
    1,
  );
  return { A, B, C, F: [B[0] + (C[0] - B[0]) * t, B[1] + (C[1] - B[1]) * t] };
}

Object.assign(VTOROY, {
  'z01.trapeciya-radius': (p) => {
    /* Перебор радиуса с шагом 0,5: сумма оснований равна сумме боковых. */
    for (let r2 = 1; r2 < 400; r2 += 1) if (close(r2 + p.c, p.per / 2)) return r2 / 2;
    return NaN;
  },
  'z01.ravnobedr-osnovanie-cos': (p) => {
    const t = ravnobedr(p.l, Math.acos(p.c));
    return Math.round(Math.hypot(t.B[0] - t.A[0], t.B[1] - t.A[1]) * 1e6) / 1e6;
  },
  'z01.ravnobedr-bok-sin': (p) => {
    const t = ravnobedr(1, Math.asin(p.s));
    return Math.round(((p.c * Math.hypot(t.C[0], t.C[1])) / t.B[0]) * 1e6) / 1e6;
  },
  'z01.bissektrisa-afc': (p) => {
    const t = bissektrisaF(p.b);
    return Math.round(ugol(t.A, t.F, t.C) * 1e6) / 1e6;
  },
  'z01.bissektrisa-afb': (p) => {
    const t = bissektrisaF(p.b);
    return Math.round(ugol(t.A, t.F, t.B) * 1e6) / 1e6;
  },
  'z02.skalyar-po-risunku': (p) => VK.skalyarnoePoRisunku(p).proverka,
  'z02.dlina-km': (p) => VK.dlinaKM(p).proverka,
  'z03.prizma-gipotenuza': (p) => Z3_2.P03_20S.poModeli(p),
  'z03.prizma-bez-piramidy': (p) => Z3_2.P03_28S.poModeli(p),
  'z03.piramida-delit-rebro': (p) => Z3_3.P03_48S.poModeli(p),
  'z03.dva-cilindra-vyshe': (p) => Z3_5.P03_69S.poModeli(p),
  'z03.dve-kruzhki': (p) => P03_70.poModeli(p),
});

/* ── Партия 2: №7, №8, №12 вариантов 7–12 ─────────────────────── */

Object.assign(VTOROY, {
  'z07.kub-obratnoe': podstanovka7(Z7.PV7_KUB_OBRATNOE),
  'z07.koren-x2': (p) => {
    /* Перебор корней x⁴ = ax² − b на целой сетке и подстановка: меньший. */
    const c = Z7.PV7_KOREN_KVADRAT.chisla(p);
    for (let x = -100; x <= 100; x += 0.25) {
      if (c.odz(x) && close(c.lhs(x), c.rhs(x))) return x;
    }
    return NaN;
  },
  'z07.koren-smeshannoe': (p) => {
    /* Ненулевой корень бисекцией √(kx) − cx на (ε; 1000), c·x растёт быстрее. */
    const c = Z7.PV7_KOREN_LINEYNYY.chisla(p);
    const x = bisekciya((u) => -(c.lhs(u) - c.rhs(u)), 1e-6, 1000);
    return Math.round(x * 1e6) / 1e6;
  },
  'z08.log-chastnoe-stepeney': (p) => VY.logChastnoeStepeney(p).proverka,
  'z08.trig-privedenie': (p) => VY.trigPrivedenie(p).proverka,
  'z08.log-am-bn': (p) => VY.logAmBn(p).proverka,
  'z12.parabola-b': (p) => GR.parabolaB(p).proverka,
  'z12.pokazatelnaya-otnoshenie': (p) => GR.pokazatelnayaOtnoshenie(p).proverka,
  'z12.parabola-korni': (p) => GR.parabolaKorni(p).proverka,
});

/* ── Варианты ───────────────────────────────────────────────────── */

const { GOTOVY } = requireSrc('lib/povyshennye/dannye/index');
const nomera = GOTOVY.filter((k) => only.length === 0 || only.includes(k));
const vyhod = [];
const vseZadachi = new Map();
const otchet = [];

for (const k of nomera) {
  const t0 = Date.now();
  const { VARIANT } = requireSrc(`lib/povyshennye/dannye/v${String(k).padStart(2, '0')}`);
  if (VARIANT.k !== k) fail(`вариант ${k}`, `в данных k = ${VARIANT.k}`);
  if (VARIANT.versii.length !== 6) fail(`вариант ${k}`, `версий ${VARIANT.versii.length}, нужно 6`);
  let set;
  try {
    set = povSetIz(k, VARIANT.versii);
  } catch (e) {
    fail(`вариант ${k}`, `не собрался: ${e.stack ?? e}`);
    continue;
  }
  const again = povSetIz(k, VARIANT.versii);
  if (JSON.stringify(set) !== JSON.stringify(again))
    fail(`вариант ${k}`, 'сборка не детерминирована');

  for (let i = 0; i < 13; i += 1) {
    const ege = i + 1;
    const sh = new Set();
    let ok = true;
    for (let v = 0; v < VARIANT.versii.length; v += 1) {
      const z = VARIANT.versii[v][i];
      const t = set.variants[v].tasks[i];
      const kv = `${k}.${v + 1} №${ege}`;
      if (SHABLONY[z.s]?.ege !== ege) {
        fail(kv, `шаблон ${z.s} не для задания ${ege}`);
        ok = false;
        continue;
      }
      const klyuch = `${z.s}|${JSON.stringify(z.p)}`;
      if (sh.has(klyuch)) {
        fail(kv, 'числа совпадают с другой версией варианта');
        ok = false;
      }
      sh.add(klyuch);
      if (vseZadachi.has(klyuch)) {
        fail(kv, `та же задача, что ${vseZadachi.get(klyuch)}`);
        ok = false;
      }
      vseZadachi.set(klyuch, kv);

      const n = normalizeAnswer(t.answer);
      if (!n.ok) {
        fail(kv, `ответ «${t.answer}» не по правилам бланка`);
        ok = false;
      }
      const x = num(t.answer);
      if ([4, 5, 6].includes(ege) && Number.isInteger(x)) fail(kv, `у №${ege} ответ целый: ${x}`);
      if ([4, 5].includes(ege) && !(x > 0 && x < 1)) fail(kv, `вероятность ${x} вне (0; 1)`);
      if (ege === 13 && !Number.isInteger(x)) fail(kv, `сумма не целая: ${x}`);
      if (x === 0) fail(kv, 'ответ 0');
      /* Хвосты двоичной арифметики: в ответе ЕГЭ не больше 4 знаков после запятой. */
      if ((String(t.answer).split(/[,.]/)[1] ?? '').length > 4)
        fail(kv, `ответ «${t.answer}» с хвостом`);
      if (!t.statement || !t.solutionTeacher || !t.solutionStudent) {
        fail(kv, 'нет условия или решения');
        ok = false;
      }
      for (const [chto, html] of [
        ['условие', t.statement],
        ['решение учителя', t.solutionTeacher],
        ['разбор', t.solutionStudent],
      ]) {
        for (const text of visibleTexts(html ?? '')) {
          const hvost = /\d[,.]\d{6,}/.exec(text.replace(/\{,\}/g, ','));
          if (hvost !== null) fail(kv, `число с хвостом в «${chto}»: ${hvost[0]}`);
          const raw = findRawTex(text);
          if (raw.length > 0) {
            fail(
              kv,
              `сырой TeX в «${chto}»: ${raw
                .slice(0, 3)
                .map((r) => r.match ?? r)
                .join(' | ')}`,
            );
            ok = false;
          }
        }
      }
      if ([1, 3, 9, 12].includes(ege) && t.figure === null && z.s !== 'z09.skorost')
        fail(kv, 'нет рисунка');
      const vtoroy = VTOROY[z.s]?.(z.p);
      if (vtoroy === undefined || !close(vtoroy, x)) {
        fail(kv, `второй счёт ${vtoroy} ≠ ответу ${x}`);
        ok = false;
      }
      vyhod.push({ kv: `${k}.${v + 1}`, ege, s: z.s, p: z.p, answer: x });
    }
    const info = SHABLONY[VARIANT.versii[0][i].s];
    otchet.push({ k, ege, prototip: info?.prototip ?? '?', otkuda: info?.otkuda, ok });
  }
  console.log(`  вариант ${k}: 6 версий × 13 заданий, ${Date.now() - t0} мс`);
}

if (JSON_OUT !== null) {
  fs.writeFileSync(JSON_OUT, JSON.stringify(vyhod, null, 1));
  console.log(`  выгрузка для sympy: ${JSON_OUT} (${vyhod.length} задач)`);
}

if (REPORT) {
  console.log('\n| Вариант | № | Прототип | Генератор | Проверка |');
  console.log('|---|---|---|---|---|');
  for (const r of otchet) {
    console.log(
      `| ${r.k} | ${r.ege} | ${r.prototip} | ${r.otkuda === 'razdel' ? 'переиспользован генератор раздела' : 'новый шаблон в модуле раздела'} | ${r.ok ? 'пройдена' : '**нет**'} |`,
    );
  }
}

if (failures > 0) {
  console.error(`\nРаздел «Варианты повышенной сложности»: ошибок ${failures}`);
  process.exit(1);
}
console.log(`\nРаздел «Варианты повышенной сложности»: ${vyhod.length} задач — всё сходится`);
