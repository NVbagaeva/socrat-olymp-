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

/* ── Партия 2 ───────────────────────────────────────────────────── */

Object.assign(VTOROY, {
  'z09.kasatelnaya': (p) => PR9.kasatelnayaPoUzlam(p)?.proverka ?? NaN,
  'z09.znak-v-tochkah': (p) => PR9.znakVTochkah(p)?.proverka ?? NaN,
  'z10.linza': (p) => {
    /* Наименьшее d₁ — перебор d₁ с шагом 0,01 см: есть ли d₂ в пределах. */
    for (let i = Math.round(p.d1min * 100); i <= p.d1max * 100; i += 1) {
      const d2 = 1 / (1 / p.f - 1 / (i / 100));
      if (d2 > 0 && d2 >= p.d2min - 1e-9 && d2 <= p.d2max + 1e-9) return i / 100;
    }
    return NaN;
  },
  'z10.linza-max': (p) => {
    for (let i = Math.round(p.d1max * 100); i >= p.d1min * 100; i -= 1) {
      const d2 = 1 / (1 / p.f - 1 / (i / 100));
      if (d2 > 0 && d2 >= p.d2min - 1e-9 && d2 <= p.d2max + 1e-9) return i / 100;
    }
    return NaN;
  },
  'z10.dolya-vremeni': (p) => {
    /* Мера {t ∈ [0; τ]: v(t) ≤ c} численно: 10⁶ отрезков, по середине. */
    const A = p.ak * Math.sqrt(p.am);
    const N = 1_000_000;
    let m = 0;
    for (let i = 0; i < N; i += 1) {
      const t = ((i + 0.5) * p.tau) / N;
      if (A * Math.sin((Math.PI * t) / p.T) <= p.c + 1e-12) m += 1;
    }
    return Math.round((m / N) * 1e4) / 1e4;
  },
  'z10.raspad': (p) => {
    /* Масса убывает: бисекция m(t) = m. */
    const t = bisekciya((u) => p.m - p.m0 * 2 ** (-u / p.T), 0, 1000);
    return Math.round(t * 1e6) / 1e6;
  },
  'z11.tri-rastvora': (p) => {
    /* Система 2×2 по Крамеру: (a − p₁)x + (b − p₁)y = (p₁ − c)m₁ и то же для второй смеси. */
    const [a1, b1, c1] = [p.a - p.p1, p.b - p.p1, (p.p1 - p.c) * p.m1];
    const [a2, b2, c2] = [p.a - p.p2, p.b - p.p2, (p.p2 - p.c) * p.m2];
    const det = a1 * b2 - a2 * b1;
    const x = (c1 * b2 - c2 * b1) / det;
    const y = (a1 * c2 - a2 * c1) / det;
    return Math.round((p.ask === 'a' ? x : y) * 1e6) / 1e6;
  },
  'z11.suhogruzy': (p) => {
    /* Перебор разности скоростей с шагом 0,01 км/ч: путь относительно первого. */
    for (let i = 1; i <= 100000; i += 1) {
      if (Math.abs(((i / 100) * p.t) / 60 - (p.a + p.L1 + p.L2 + p.b) / 1000) < 1e-9)
        return i / 100;
    }
    return NaN;
  },
  'z11.ves-put': (p) => {
    /* Время в пути растёт по x: бисекция, затем путь туда и обратно. */
    const x = bisekciya((u) => u / (p.v + p.c) + u / (p.v - p.c) - (p.T - p.st), 0, 10000);
    return Math.round(2 * x * 1e6) / 1e6;
  },
  'z13.dif-stavka': (p) => {
    /* Перебор целых ставок прямым пересчётом таблицы по годам. */
    for (let r = 1; r <= 100; r += 1) {
      let dolg = p.S;
      let vsego = 0;
      for (let i = 0; i < p.n; i += 1) {
        vsego += dolg * (r / 100) + p.S / p.n;
        dolg -= p.S / p.n;
      }
      if (Math.abs(vsego - p.T) < 1e-6) return r;
    }
    return NaN;
  },
  'z13.ravnye-popolneniya': (p) => {
    /* Итог вклада растёт по пополнению: бисекция, вклад — по годам. */
    const itog = (x) => {
      let s = p.S;
      for (let i = 0; i < 3; i += 1) s = s * (1 + p.r / 100) + (i < 2 ? x : 0);
      return s - p.Z;
    };
    return Math.round(bisekciya(itog, 0, 1e6) * 1e6) / 1e6;
  },
  'z13.summa-ubyvanie': (p) => {
    let dolg = p.S * 1e6;
    let vsego = 0;
    for (let i = 1; i <= p.n; i += 1) {
      const novyy = i === p.n ? 0 : dolg * (1 - p.q / 100);
      vsego += dolg * (1 + p.r / 100) - novyy;
      dolg = novyy;
    }
    return Math.round(vsego * 100) / 100;
  },
});

/* ── Партия 3: варианты 13–18 ──────────────────────────────────── */

const Z3_1 = requireSrc('lib/zadanie3/razdel1/povyshennye');
const Z3_7 = requireSrc('lib/zadanie3/razdel7/povyshennye');
const Z3_8 = requireSrc('lib/zadanie3/razdel8/povyshennye');
const { prototype: prototype7 } = requireSrc('lib/zadanie7/prototypes');
const r6 = (x) => Math.round(x * 1e6) / 1e6;

/** Параллелограмм с углом 60° при A: AB = c, AD = d, B — сверху. */
function parallelogrammXY(c, d) {
  const B = [c / 2, (c * Math.sqrt(3)) / 2];
  return { A: [0, 0], B, C: [B[0] + d, B[1]], D: [d, 0] };
}

/** Пересечение биссектрисы угла при вершине V (лучи к P и Q) с прямой y = y0. */
function bissektrisaDo(V, P, Q, y0) {
  const e = (T) => {
    const L = Math.hypot(T[0] - V[0], T[1] - V[1]);
    return [(T[0] - V[0]) / L, (T[1] - V[1]) / L];
  };
  const [u1, u2] = [e(P), e(Q)];
  const w = [u1[0] + u2[0], u1[1] + u2[1]];
  const s = (y0 - V[1]) / w[1];
  return [V[0] + s * w[0], y0];
}

Object.assign(VTOROY, {
  'z01.parallelogramm-bissektrisa': (p) => {
    /* Бисекция по AB: биссектриса угла B делит AD в отношении m : n. */
    const c = bisekciya(
      (ab) => {
        const t = parallelogrammXY(ab, p.per / 2 - ab);
        const K = bissektrisaDo(t.B, t.A, t.C, 0);
        return K[0] / (t.D[0] - K[0]) - p.m / p.n;
      },
      1e-6,
      p.per / 4,
    );
    return r6(p.per / 2 - c);
  },
  'z01.parallelogramm-dve-bissektrisy': (p) => {
    /* Бисекция по AB: биссектрисы углов A и D встречаются на прямой BC. */
    const c = bisekciya(
      (ab) => {
        const t = parallelogrammXY(ab, p.per / 2 - ab);
        const K1 = bissektrisaDo(t.A, t.B, t.D, t.B[1]);
        const K2 = bissektrisaDo(t.D, t.A, t.C, t.B[1]);
        return K1[0] - K2[0];
      },
      1e-6,
      p.per / 4 + 1e-3,
    );
    return r6(p.k ? p.per / 2 - c : c);
  },
  'z01.ravnobedr-vysota-sin': (p) => {
    /* Угол при основании — бисекцией: расстояние от A до прямой BC равно h. */
    const al = bisekciya((u) => p.a * Math.sin(u) - p.h, 0, Math.PI / 2);
    return r6(Math.sin(al));
  },
  'z01.ravnobedr-vysota-cos': (p) => {
    const al = bisekciya((u) => p.a * Math.sin(u) - p.h * Math.sqrt(p.m), 0, Math.PI / 2);
    return r6(Math.cos(al));
  },
  'z01.vpisannyy-dva-ugla': (p) => {
    /* Углы по дугам: вписанный угол — половина дуги, на которую опирается. */
    const ugly = [p.a, p.b].map((u) => (360 - 2 * u) / 2);
    return p.k ? Math.max(...ugly) : Math.min(...ugly);
  },
  'z02.kosinus-km': (p) => VK.kosinusPoKoordinatam(p).proverka,
  'z02.kosinus-po-risunku': (p) => VK.kosinusPoRisunku(p).proverka,
  'z03.konus-bokovaya': (p) => Z3_7.PV03_KONUS_BOKOVAYA.poModeli(p),
  'z03.kub-v-share': (p) => Z3_8.PV03_KUB_V_SHARE.poModeli(p),
  'z03.okolo-sfery-poverhnost': (p) => Z3_8.PV03_PARALLELEPIPED_OKOLO_SFERY.poModeli(p),
  'z03.piramida-v-parallelepipede': (p) => Z3_1.PV03_PIRAMIDA_ABCA1B1.poModeli(p),
  'z03.tetraedr-v-parallelepipede': (p) => Z3_1.PV03_TETRAEDR_ABCB1.poModeli(p),
  'z04.pary': (p) => VER.PV4_PARY.perebor(p),
  'z04.tri-tsveta': (p) => VER.PV4_TRI_TSVETA.perebor(p),
  'z04.taksi': (p) => VER.PV4_TAKSI.perebor(p),
  'z05.odna-gruppa': (p) => VER.PV5_ODNA_GRUPPA.perebor(p),
  'z05.hotya-by-dve': (p) => VER.PV5_HOTYA_BY_DVE.perebor(p),
  'z05.summa-ochkov': (p) => VER.PV5_SUMMA_OCHKOV.perebor(p),
  'z05.bernulli': (p) => VER.PV5_BERNULLI.perebor(p),
  'z06.lotereya': (p) => prototype6('P04').pereschet(p),
  'z06.ozhidanie': (p) => prototype6('P07').pereschet(p),
  'z07.nechetnaya-stepen': podstanovka7(prototype7('P02')),
  'z07.pokazatelnoe-osnovaniya': podstanovka7(Z7.PV7_POKAZATELNOE),
  'z07.log-kvadratnoe': podstanovka7(Z7.PV7_LOG_KVADRATNOE),
  'z08.cos-dvoynoy': (p) => VY.cosDvoynogo(p).proverka,
  'z08.stepen-s-log': (p) => VY.stepenSLog(p).proverka,
  'z08.tg-po-znacheniyu': (p) => VY.tgPoZnacheniyu(p).proverka,
  'z09.kasatelnaya-nachalo': (p) => PR9.kasatelnayaCherezNachalo(p)?.proverka ?? NaN,
  'z09.naib-naim-metka': (p) => PR9.naibNaimMetka(p)?.proverka ?? NaN,
  'z09.skorost-mnogochlen': (p) => PR9.skorostMnogochlen(p).proverka,
  'z10.gorizont': (p) => {
    /* Высоты бисекцией по l = √(2Rh), разность в метрах. */
    const h = (l) => bisekciya((u) => Math.sqrt(2 * p.R * u) - l, 0, 100);
    return r6((h(p.l2) - h(p.l1)) * 1000);
  },
  'z10.pruzhina': (p) => {
    const vv = p.v0 * Math.sin((2 * Math.PI * p.t) / p.T);
    return r6((p.m * vv * vv) / 2);
  },
  'z10.kpd': (p) => r6(bisekciya((T1) => ((T1 - p.T2) / T1) * 100 - p.eta, p.T2, 1e5)),
  'z11.dve-truby': (p) => {
    /* Доля наполнения к моменту T растёт — бисекция. */
    const dolya = (T) => Math.min(T, p.d) / p.t + (2 * Math.max(0, T - p.d)) / p.t - 1;
    return r6(bisekciya(dolya, 0, 1000));
  },
  'z11.rastvor-i-voda': (p) => {
    /* Перебор массы первого раствора с шагом 0,1 кг: обе концентрации сходятся. */
    for (let i = 1; i <= 100000; i += 1) {
      const xx = i / 10;
      const M = (p.p2 * p.m) / (p.p1 - p.p2);
      const y = M - xx;
      if (y > 0 && Math.abs(p.a * xx + p.b * y - p.p1 * M) < 1e-6)
        return p.ask === 'a' ? xx : r6(y);
    }
    return NaN;
  },
  'z11.avtobus-avtomobil': (p) => {
    /* Бисекция по AK: при найденной скорости автобуса автомобиль возвращается вовремя. */
    const f = (d) => {
      const u = d / (p.t0 + d / p.v);
      return p.S / u - (p.t0 + (2 * d) / p.v);
    };
    return r6(bisekciya((d) => -f(d), 1e-6, p.S - 1e-6));
  },
  'z12.giperbola-kb': (p) => GR.giperbolaKB(p).proverka,
  'z12.koren-pryamaya': (p) => GR.korenPryamaya(p).proverka,
  'z12.parabola-pryamaya': (p) => GR.parabolaPryamaya(p).proverka,
  'z13.dva-ravnyh-summa': (p) => {
    /* Платёж бисекцией: при нём долг через два года равен нулю. */
    const S = p.S * 1000;
    const k = 1 + p.r / 100;
    const X = bisekciya((x) => -((S * k - x) * k - x), 0, S * 2);
    return Math.round(2 * X * 100) / 100;
  },
  'z13.dva-ravnyh-stavka': (p) => {
    for (let r = 1; r <= 100; r += 1) {
      const k = 1 + r / 100;
      if (Math.abs((p.S * k - p.x) * k - p.x) < 1e-6) return r;
    }
    return NaN;
  },
  'z13.vklad-nachalnyy': (p) => {
    for (let S = 1; S <= 200; S += 1) {
      let v = S * 100;
      for (let i = 0; i < 3; i += 1) v = v * (1 + p.r / 100) + (i < 2 ? p.x : 0);
      if (Math.abs(v - p.Z) < 1e-6) return S;
    }
    return NaN;
  },
});

/* №4–5, где ответ — не вероятность: отношение вероятностей, число билетов. */
const NE_VEROYATNOST = new Set(['z05.bernulli-otnoshenie', 'z05.bilety', 'z05.kosti-otnoshenie']);

/* Партия 4 (варианты 19–24). */
const ugolMezhdu = (u, v) =>
  (Math.acos((u[0] * v[0] + u[1] * v[1]) / (Math.hypot(...u) * Math.hypot(...v))) * 180) / Math.PI;
Object.assign(VTOROY, {
  'z01.bissektrisy-aob': (p) => r6(180 - p.a / 2 - (180 - p.c - p.a) / 2),
  'z01.vysota-bissektrisa': (p) => {
    /* C в начале, катеты по осям: CA = 1 вдоль Ox, CB = tg A; меньший угол — A. */
    const f = (a) => {
      const A = [1, 0];
      const B = [0, Math.tan((a * Math.PI) / 180)];
      const n = [B[1] - A[1], A[0] - B[0]];
      const h = n[0] * A[0] + n[1] * A[1] < 0 ? [-n[0], -n[1]] : n;
      return ugolMezhdu(h, [1, 1]) - p.f;
    };
    return r6(bisekciya((a) => -f(a), 1e-6, 45 - 1e-6));
  },
  'z01.bissektrisa-mediana': (p) => {
    const B = [1, 0];
    const A = [0, Math.tan((p.b * Math.PI) / 180)];
    return r6(ugolMezhdu([(A[0] + B[0]) / 2, (A[1] + B[1]) / 2], [1, 1]));
  },
  'z01.trapeciya-osnovanie': (p) => {
    /* Основания x и y: x + y = 2m, а части средней линии x/2 : y/2 = p : q. */
    const x = (2 * p.m * p.p) / (p.p + p.q);
    const y = 2 * p.m - x;
    return r6(p.k ? Math.max(x, y) : Math.min(x, y));
  },
  'z03.piramida-poverhnost': (p) =>
    requireSrc('lib/zadanie3/razdel3/povyshennye').PV03_PIRAMIDA_POVERHNOST.poModeli(p),
  'z03.cilindr-konus': (p) =>
    requireSrc('lib/zadanie3/razdel5/povyshennye').PV03_CILINDR_KONUS.poModeli(p),
  'z03.shar-poverhnost': (p) =>
    requireSrc('lib/zadanie3/razdel6/povyshennye').PV03_SHAR_POVERHNOST.poModeli(p),
  'z04.poryadok': (p) => VER.PV4_PORYADOK.perebor(p),
  'z04.tri-ishoda': (p) => VER.PV4_TRI_ISHODA.perebor(p),
  'z04.dva-druga': (p) => VER.PV4_DVA_DRUGA.perebor(p),
  'z05.bernulli-otnoshenie': (p) => VER.PV5_BERNULLI_OTNOSHENIE.perebor(p),
  'z05.misheni-dva-vystrela': (p) => VER.PV5_MISHENI_DVA_VYSTRELA.perebor(p),
  'z05.bilety': (p) => VER.PV5_BILETY.perebor(p),
  'z07.koren-postoronniy': podstanovka7(Z7.PV7_KOREN_POSTORONNIY),
  'z07.stepen-kvadrata': podstanovka7(Z7.PV7_STEPEN_KVADRATA),
  'z08.stepeni-tri-osnovaniya': (p) => r6(VY.stepeniTriOsnovaniya(p).proverka),
  'z08.log-raznost': (p) => r6(VY.logRaznost(p).proverka),
  'z08.korni-proizvedenie': (p) => r6(VY.korniProizvedenie(p).proverka),
  'z09.kasatelnaya-formula': (p) => PR9.kasatelnayaFormula(p).proverka,
  'z10.radiator': (p) =>
    /* Длина трубы растёт при остывании — бисекция по T от T_в вниз до T_п. */
    r6(
      bisekciya(
        (T) => -(((p.alpha * p.c * p.m) / p.gamma) * Math.log2((p.Tv - p.Tp) / (T - p.Tp)) - p.x),
        p.Tp + 1e-9,
        p.Tv,
      ),
    ),
  'z10.razgon': (p) =>
    p.vid === 'l'
      ? r6(bisekciya((l) => Math.sqrt(2 * l * p.a) - p.v, 0, 1e6))
      : r6(bisekciya((a) => Math.sqrt(2 * p.l * a) - p.v, 0, 1e9)),
  'z10.kolokol': (p) =>
    p.vid === 'p'
      ? r6(bisekciya((p2) => p.alpha * p.nu * p.T * Math.log2(p2 / p.p1) - p.A, p.p1, 1e6))
      : r6(bisekciya((V2) => -(p.alpha * p.nu * p.T * Math.log2(p.V1 / V2) - p.A), 1e-9, p.V1)),
  'z11.mastera': (p) => {
    /* Перебор производительности второго мастера: разница во времени в минутах. */
    for (let y = p.r + 1; y <= 1000; y += 1) {
      if (Math.abs((p.N1 / (y - p.r) - p.N2 / y) * 60 - p.tm) < 1e-9)
        return p.ask === 'vtoroy' ? y : y - p.r;
    }
    return NaN;
  },
  'z11.plot-yahta': (p) => {
    const T = p.R / p.vt - p.z;
    return r6(bisekciya((v) => -(p.S / (v + p.vt) + p.S / (v - p.vt) - T), p.vt + 1e-9, 1e4));
  },
  'z11.brigady': (p) => {
    /* По дням: работа обеих бригад, пока объёмы не сравняются после перехода. */
    for (let T = p.d + 1; T <= 1000; T += 1) {
      if (p.n1 * p.d + (p.n1 + p.k) * (T - p.d) === p.n2 * p.d + (p.n2 - p.k) * (T - p.d)) return T;
    }
    return NaN;
  },
  'z12.dva-uzla': (p) => r6(GR.dvaUzla(p).proverka),
  /* P4-END */
});

/* Партия 5 (варианты 25–30). */
const FIG1 = requireSrc('lib/planimetriya/figury');
const dlina = (P, Q) => Math.hypot(P[0] - Q[0], P[1] - Q[1]);
/** Расстояние от точки P до прямой AB. */
const doPryamoy = (P, A, B) =>
  Math.abs((B[0] - A[0]) * (A[1] - P[1]) - (A[0] - P[0]) * (B[1] - A[1])) / dlina(A, B);
/** Точка окружности радиуса 1 по углу в градусах. */
const naKruge = (g) => [Math.cos((g * Math.PI) / 180), Math.sin((g * Math.PI) / 180)];
Object.assign(VTOROY, {
  'z01.opisannyy-storona': (p) => {
    /* Строим описанный четырёхугольник по всем сторонам и меряем искомую. */
    const f = FIG1.opisannyyPoStoronam(p.ab, p.bc, p.cd, p.da);
    return r6(p.k ? dlina(f.A, f.D) : dlina(f.C, f.D));
  },
  'z01.opisannyy-perimetr': (p) => {
    /* Периметр построенной фигуры, минус данная сторона — от его половины. */
    const f = FIG1.opisannyyPoStoronam(p.ab, p.bc, p.cd, p.ab + p.cd - p.bc);
    const per = dlina(f.A, f.B) + dlina(f.B, f.C) + dlina(f.C, f.D) + dlina(f.D, f.A);
    return r6(per / 2 - (p.k ? dlina(f.C, f.D) : dlina(f.A, f.B)));
  },
  'z01.parallelogramm-vysota': (p) => {
    /* Угол по площади, вершины по координатам, высоты — расстояния от B до AD и CD. */
    const u = Math.asin(p.s / (p.a * p.b));
    const A = [0, 0];
    const D = [p.b, 0];
    const B = [p.a * Math.cos(u), p.a * Math.sin(u)];
    const C = [B[0] + p.b, B[1]];
    const h = [doPryamoy(B, A, D), doPryamoy(B, C, D)];
    return r6(p.k ? Math.max(...h) : Math.min(...h));
  },
  'z01.vysoty-treugolnika': (p) => {
    /* C в начале, CA = b вдоль Ox, B на расстоянии a под углом, где высота к CA равна h. */
    const g = Math.asin(p.h / p.a);
    const C = [0, 0];
    const A = [p.b, 0];
    const B = [p.a * Math.cos(g), p.a * Math.sin(g)];
    return r6(doPryamoy(A, C, B));
  },
  'z01.vpisannyy-abc': (p) => {
    /* Точки на окружности: дуга AD = 2·ABD, дуга DC = 2·CAD, B — на оставшейся дуге. */
    const A = naKruge(0);
    const D = naKruge(2 * p.abd);
    const C = naKruge(2 * p.abd + 2 * p.cad);
    const B = naKruge((2 * p.abd + 2 * p.cad + 360) / 2);
    /* Построение сверяем с условием: углы ABD и CAD — те, что даны. */
    if (Math.abs(ugol(A, B, D) - p.abd) > 1e-6 || Math.abs(ugol(C, A, D) - p.cad) > 1e-6)
      return NaN;
    return r6(ugol(A, B, C));
  },
  'z01.vpisannyy-cad': (p) => {
    const A = naKruge(0);
    const D = naKruge(2 * p.abd);
    const C = naKruge(2 * p.abc);
    const B = naKruge((2 * p.abc + 360) / 2);
    if (Math.abs(ugol(A, B, C) - p.abc) > 1e-6 || Math.abs(ugol(A, B, D) - p.abd) > 1e-6)
      return NaN;
    return r6(ugol(C, A, D));
  },
  'z02.skalyar-treh': (p) => VK.skalyarnoeTrehPoRisunku(p).proverka,
  'z03.sosud-prizma': (p) => Z3_5.PV03_SOSUD_PRIZMA.poModeli(p),
  'z03.shar-cilindr-poverhnost': (p) => r6(Z3_8.PV03_SHAR_CILINDR_S.poModeli(p)),
  'z03.shest-mnogogrannik': (p) => r6(Z3_2.PV03_SHEST.poModeli(p)),
  'z04.zapasnaya': (p) => VER.PV4_ZAPASNAYA.perebor(p),
  'z04.kruglyy-stol': (p) => VER.PV4_KRUGLYY_STOL.perebor(p),
  'z04.ochered': (p) => VER.PV4_OCHERED.perebor(p),
  'z05.dve-linii': (p) => VER.PV5_DVE_LINII.perebor(p),
  'z05.kosti-otnoshenie': (p) => VER.PV5_KOSTI_OTNOSHENIE.perebor(p),
  'z05.bilety-sochetaniya': (p) => VER.PV5_BILETY_SOCHETANIYA.perebor(p),
  'z07.koren-drob': podstanovka7(Z7.PV7_KOREN_DROB),
  'z07.log-mnozhitel': podstanovka7(Z7.PV7_LOG_MNOZHITEL),
  'z08.log-skobki': (p) => r6(VY.logSkobki(p).proverka),
  'z08.log-drob-summa': (p) => r6(VY.logDrobSumma(p).proverka),
  'z08.stepeni-proizvedenie': (p) => r6(VY.stepeniProizvedenie(p).proverka),
  'z08.sin-cos': (p) => r6(VY.sinCosProizvedenie(p).proverka),
  'z09.celye-znak': (p) => PR9.celyeZnak(p).proverka,
  'z09.nuli-proizvodnoy': (p) => PR9.nuliProizvodnoy(p).proverka,
  'z09.gorizontalnaya': (p) => PR9.gorizontalnayaKasatelnaya(p).proverka,
  'z10.udar': (p) =>
    /* Наименьший 2α: энергия возрастает по α на (0°; 90°] — бисекция по α. */
    r6(2 * bisekciya((a) => p.m * p.v ** 2 * Math.sin((a * Math.PI) / 180) ** 2 - p.Q, 0, 90)),
  'z10.platforma': (p) =>
    p.vid === 'v'
      ? r6(
          bisekciya(
            (v) => (p.m / (p.m + p.M)) * v * Math.cos((p.alpha * Math.PI) / 180) - p.u,
            0,
            1e4,
          ),
        )
      : r6(
          bisekciya(
            (a) => -((p.m / (p.m + p.M)) * p.v * Math.cos((a * Math.PI) / 180) - p.u),
            0,
            90,
          ),
        ),
  'z10.kolodec': (p) => r6(5 * p.t1 ** 2 - 5 * (p.t1 - p.dt) ** 2),
  'z10.arhimed': (p) =>
    r6(bisekciya((x) => (p.vid === 'shar' ? p.alpha : 1) * p.rho * p.g * x ** 3 - p.F, 0, 100)),
  'z11.krugovaya-trassa': (p) => {
    /* Перебор скорости велосипедиста с шагом 0,01: первый обгон и второй через круг. */
    for (let i = 1; i <= 30000; i += 1) {
      const vc = i / 100;
      const vm = (vc * (p.t0 + p.t1)) / p.t1;
      if (Math.abs(((vm - vc) * p.t2) / 60 - p.L) < 1e-9) return p.ask === 'moto' ? r6(vm) : vc;
    }
    return NaN;
  },
  'z11.gonki': (p) => {
    /* Перебор скорости второго: разность скоростей — круг за t минут, разница финиша — dt минут. */
    for (let v = 1; v <= 500; v += 1) {
      const S = p.n * p.L;
      /* Обгон на круг через t минут: v₁ = v + 60L/t. */
      const v1 = v + (p.L * 60) / p.t;
      if (Math.abs((S / v - S / v1) * 60 - p.dt) < 1e-9) return p.ask === 'vtoroy' ? v : v1;
    }
    return NaN;
  },
  'z11.splavy': (p) => {
    /* Бисекция по массе первого сплава: масса металла в смеси. */
    const m1 = bisekciya(
      (x) => -((x * p.p1 + (p.M - x) * p.p2) / 100 - (p.M * p.p3) / 100),
      0,
      p.M,
    );
    const m2 = p.M - m1;
    return r6(p.ask === 'pervyy' ? m1 : p.ask === 'vtoroy' ? m2 : Math.abs(m2 - m1));
  },
  'z11.sushka': (p) =>
    r6(
      p.vid === 'syrye'
        ? bisekciya((x) => x * (1 - p.w1 / 100) - p.M * (1 - p.w2 / 100), 0, 1e5)
        : bisekciya((x) => x * (1 - p.w2 / 100) - p.M * (1 - p.w1 / 100), 0, 1e5),
    ),
  'z11.dvoe-rabochih': (p) => {
    /* Перебор: за сколько дней первый (второй) сделает всё, вместе — за T. */
    const t = bisekciya((x) => -(1 / x + p.a / (p.b * x) - 1 / p.T), 1e-6, 1e5);
    return r6(p.ask === 'pervyy' ? t : (t * p.b) / p.a);
  },
  'z12.dve-pryamye': (p) => r6(GR.dvePryamye(p).proverka),
});

/* ── Партия 6 (варианты 31–36) ──────────────────────────────────── */

/** Точка пересечения прямых PQ и RS. */
function peresechenie(P, Q, R, S) {
  const d1 = [Q[0] - P[0], Q[1] - P[1]];
  const d2 = [S[0] - R[0], S[1] - R[1]];
  const den = d1[0] * d2[1] - d1[1] * d2[0];
  const t = ((R[0] - P[0]) * d2[1] - (R[1] - P[1]) * d2[0]) / den;
  return [P[0] + t * d1[0], P[1] + t * d1[1]];
}

/** Секущие из C: дуга AB (без D, E) = t, дуга DE = δ; точки на единичной окружности. */
function sekushchie(t, delta) {
  const x = (360 - t - delta) / 2;
  const D = naKruge(delta / 2);
  const E = naKruge(-delta / 2);
  const B = naKruge(delta / 2 + x);
  const A = naKruge(-delta / 2 - x);
  return { A, B, D, E, C: peresechenie(B, D, A, E) };
}

Object.assign(VTOROY, {
  'z01.sekushchie-dae': (p) => {
    const g = sekushchie(p.t, p.t - 2 * p.f);
    if (Math.abs(ugol(g.A, g.C, g.B) - p.f) > 1e-6) return NaN;
    return r6(ugol(g.D, g.A, g.E));
  },
  'z01.sekushchie-acb': (p) => {
    const g = sekushchie(p.t, p.s);
    if (
      Math.abs(ugol(g.A, g.D, g.B) - p.t / 2) > 1e-6 ||
      Math.abs(ugol(g.D, g.A, g.E) - p.s / 2) > 1e-6
    )
      return NaN;
    return r6(ugol(g.A, g.C, g.B));
  },
  'z01.horda-ugol': (p) => {
    const R = p.a * Math.sqrt(p.m);
    if (p.k) {
      /* Тупой вписанный угол g опирается на меньшую дугу 360 − 2g; хорда — расстояние между её концами. */
      const A = naKruge(0).map((c) => c * R);
      const B = naKruge(360 - 2 * p.g).map((c) => c * R);
      return r6(Math.hypot(A[0] - B[0], A[1] - B[1]));
    }
    /* Хорда c: центральный угол 2·arcsin(c/2R); C — середина меньшей дуги. */
    const sinKv = p.g === 120 ? 3 : p.g === 135 ? 2 : 1;
    const c = p.a * Math.sqrt(p.m * sinKv);
    const u = (2 * Math.asin(c / (2 * R)) * 180) / Math.PI;
    return r6(ugol(naKruge(0), naKruge(u / 2), naKruge(u)));
  },
  'z01.pryamoy-katet': (p) => {
    if (p.k) {
      /* cos A = v/√(u² + v²): угол A, AC = BC·ctg A. */
      const A = Math.acos(p.v / Math.hypot(p.u, p.v));
      return r6(p.bc / Math.tan(A));
    }
    /* BC = AB·sin A, AC — по теореме Пифагора. */
    const bc = (p.ab * p.p) / p.r;
    return r6(Math.sqrt(p.ab ** 2 - bc ** 2));
  },
  'z02.dlina-treh': (p) => VK.dlinaTrehPoRisunku(p).proverka,
  'z02.dlina-otnoshenie': (p) => r6(VK.dlinaOtnoshenie(p).proverka),
  'z03.detal': (p) => Z3_5.PV03_DETAL.poModeli(p),
  'z03.srednyaya-liniya': (p) => Z3_3.PV03_SREDNYAYA.poModeli(p),
  'z03.shest-chast': (p) => Z3_3.PV03_SHEST_CHAST.poModeli(p),
  'z03.cilindr-s-po-sharu': (p) => Z3_8.PV03_CILINDR_S_PO_SHARU.poModeli(p),
  'z04.vertolet': (p) => VER.PV4_VERTOLET.perebor(p),
  'z04.sumki-na': (p) => VER.PV4_SUMKI_NA.perebor(p),
  'z05.chaynye-pary': (p) => VER.PV5_CHAYNYE_PARY.perebor(p),
  'z05.pervyy-raz': (p) => VER.PV5_PERVYY_RAZ.perebor(p),
  'z05.dva-tsveta': (p) => VER.PV5_DVA_TSVETA.perebor(p),
  'z07.tozhdestvo-stepen': podstanovka7(Z7.PV7_TOZHDESTVO_STEPEN),
  'z07.log-osnovaniya': podstanovka7(Z7.PV7_LOG_OSNOVANIYA),
  'z08.stepeni-vlozhennye': (p) => r6(VY.stepeniVlozhennye(p).proverka),
  'z08.cos-dvoynogo-po': (p) => r6(VY.cosDvoynogoPo(p).proverka),
  'z08.korni-drob': (p) => r6(VY.korniDrob(p).proverka),
  'z09.summa-celyh': (p) => PR9.summaCelyhFprime(p)?.proverka ?? NaN,
  'z09.metki-fprime': (p) => PR9.metkiFprime(p)?.proverka ?? NaN,
  'z09.parallel-fprime': (p) => PR9.kasatParallelFprime(p)?.proverka ?? NaN,
  'z10.bak-koren': (p) => {
    /* Бисекция по t: H(t) убывает до опустошения, ищем H = H₀/n². */
    const k = 1 / p.kDen;
    const H = (t) => p.H0 - Math.sqrt(20 * p.H0) * k * t + 5 * k * k * t * t;
    const tPust = Math.sqrt(p.H0 / 5) / k;
    return r6(bisekciya((t) => -(H(t) - p.H0 / p.n ** 2), 0, tPust));
  },
  'z10.kondensator': (p) =>
    r6(bisekciya((U) => -(p.alpha * p.Cm * p.Rm * Math.log2(p.U0 / U) - p.t), 1e-9, p.U0)),
  'z10.nagrev': (p) => {
    const a = p.aNum / p.aDen;
    /* Температура растёт до вершины: первое время, когда T = Tmax. */
    const T = (t) => p.T0 + p.b * t + a * t * t;
    return r6(bisekciya((t) => T(t) - p.Tmax, 0, -p.b / (2 * a)));
  },
  'z10.bak-kvadrat': (p) => {
    const a = 1 / p.aDen;
    const b = -p.bNum / p.bDen;
    /* H убывает до вершины, где H = 0 (касание): минимум по перебору. */
    let best = 0;
    let hmin = Infinity;
    for (let i = 0; i <= 200000; i += 1) {
      const t = i / 1000;
      const h = a * t * t + b * t + p.H0;
      if (h < hmin) {
        hmin = h;
        best = t;
      }
    }
    return Math.abs(hmin) < 1e-6 ? r6(best) : NaN;
  },
  'z11.truby': (p) => {
    /* Перебор пропускной способности первой трубы с шагом 0,01. */
    for (let i = 1; i <= 100000; i += 1) {
      const x = i / 100;
      if (Math.abs(p.V1 / x - p.V2 / (x + p.d) - p.t) < 1e-9)
        return p.ask === 'pervaya' ? x : r6(x + p.d);
    }
    return NaN;
  },
  'z11.teplohody': (p) => {
    for (let x = 1; x <= 1000; x += 1) {
      if (Math.abs(p.S / x - p.S / (x + p.dv) - p.t) < 1e-9)
        return p.ask === 'pervyy' ? x : x + p.dv;
    }
    return NaN;
  },
  'z13.tri-ravnyh-summa': (p) => {
    const S = p.S * 1000;
    const k = 1 + p.r / 100;
    const X = bisekciya((x) => -(((S * k - x) * k - x) * k - x), 0, S * 2);
    return Math.round(3 * X * 100) / 100;
  },
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
      /* Ответ — вероятность, кроме шаблонов, где спрашивают отношение или число билетов. */
      const veroyatnostOtvet = [4, 5].includes(ege) && !NE_VEROYATNOST.has(z.s);
      if (veroyatnostOtvet && Number.isInteger(x)) fail(kv, `у №${ege} ответ целый: ${x}`);
      if (veroyatnostOtvet && !(x > 0 && x < 1)) fail(kv, `вероятность ${x} вне (0; 1)`);
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
      /* №9 без рисунка — задачи по формуле: скорость по закону движения, касательная по уравнению. */
      const bezRisunka = z.s.startsWith('z09.skorost') || z.s === 'z09.kasatelnaya-formula';
      if ([1, 3, 9, 12].includes(ege) && t.figure === null && !bezRisunka) fail(kv, 'нет рисунка');
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
