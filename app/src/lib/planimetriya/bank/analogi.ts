/**
 * Аналоги задач открытого банка: по двадцать на прототип, с другими
 * числами. Подбор детерминированный (seed `analog-<id>`): один и тот
 * же набор на сайте, в тренажёре и на листах.
 *
 * Генератор прототипа предлагает числа в духе ФИПИ (целые углы,
 * пифагоровы тройки, «хорошие» синусы и косинусы); набор принимается,
 * только если:
 *   — ответ — целое число или конечная десятичная дробь не длиннее
 *     двух знаков после запятой, положительный;
 *   — ответ сходится с измерением на фигуре (bank/proverka.ts);
 *   — набор не повторяет задачу открытого банка и другой аналог;
 *   — чертёж чист во всех режимах (ученик, подсказки, учитель).
 * Ответы аналогов по возможности различны.
 */

import { rngOf } from '../../vychisleniya/rng';
import type { Rng } from '../../veroyatnost/generator';
import { POROG } from '../figury';
import { pustoyOtchet, renderPlan, shagovPodskazki } from '../render';
import { PROTOTIPY, prototip } from '../stseny';
import type { Nabor, Params } from '../stseny/dsl';
import type { Rezhim } from '../types';
import { zadachiPrototipa } from './fipi';
import { ANALOGI_DANNYE } from './analogi-dannye';
import { izmerit } from './proverka';

/* ── Числа ───────────────────────────────────────────────────────── */

const nod = (a: number, b: number): number => (b === 0 ? Math.abs(a) : nod(b, a % b));

/** Конечная десятичная дробь не длиннее двух знаков. */
export function otvetEge(x: number): boolean {
  if (!Number.isFinite(x) || x <= 0 || x >= 100000) return false;
  return Math.abs(x * 100 - Math.round(x * 100)) < 1e-6;
}

/** √n = k√m, m свободно от квадратов. */
function koren(n: number): [number, number] {
  let k = 1;
  let m = n;
  for (let d = 2; d * d <= m; d += 1) {
    while (m % (d * d) === 0) {
      m /= d * d;
      k *= d;
    }
  }
  return [k, m];
}

/** Пифагоровы тройки (катет, катет, гипотенуза) с катетами до 60. */
const TROYKI: [number, number, number][] = (() => {
  const out: [number, number, number][] = [];
  for (let a = 1; a <= 60; a += 1) {
    for (let b = a; b <= 60; b += 1) {
      const c = Math.round(Math.hypot(a, b));
      if (c * c === a * a + b * b) out.push([a, b, c]);
    }
  }
  return out;
})();

/** Косинусы и синусы, у которых оба значения — конечные дроби. */
const PARY_SIN_COS: [number, number][] = [
  [0.6, 0.8],
  [0.8, 0.6],
  [0.28, 0.96],
  [0.96, 0.28],
];

/* ── Генераторы прототипов ───────────────────────────────────────── */

type Gen = (r: Rng) => Nabor | null;

const chet = (r: Rng, a: number, b: number) => 2 * r.int(Math.ceil(a / 2), Math.floor(b / 2));

export const GENERATORY: Record<number, Gen> = {
  1: (r) => ({ a: r.int(20, 85), v: r.int(0, 1) }),
  2: (r) => ({ c: chet(r, 10, 170), v: r.int(0, 1) }),
  3: (r) => ({ b: r.int(95, 175) }),
  4: (r) => ({ b: r.int(8, 82) }),
  5: (r) => ({ b: r.int(8, 82) }),
  6: (r) => ({ f: r.int(3, 33) }),
  7: (r) => ({ f: r.int(3, 33) }),
  8: (r) => ({ a: r.int(47, 88) }),
  9: (r) => {
    const c = r.int(30, 130);
    const d = r.int(4, Math.floor((176 - c) / 2) - 2);
    return { c, d };
  },
  10: (r) => {
    const a = r.int(30, 80);
    return { a, b: r.int(Math.max(92 - a, 35), 85), k: r.int(0, 1) };
  },
  11: (r) => {
    const c = chet(r, 30, 130);
    return { c, a: Math.round((180 - c) / 2) };
  },
  12: (r) => ({ d: chet(r, 10, 140), k: r.int(0, 1) }),
  13: (r) => ({ g: chet(r, 30, 160), k: r.int(0, 3) }),
  14: (r) => {
    const a = r.int(4, 30);
    const b = r.int(a + 2, a + 18);
    const shag = b / nod(a, b);
    if (shag >= b) return null;
    return { a, b, h: shag * r.int(1, Math.floor((b - 1) / shag)) };
  },
  15: (r) => ({ s: 4 * r.int(10, 50), k: r.int(0, 3), u: r.int(45, 70) }),
  16: (r) => {
    const a = r.int(6, 30);
    const b = r.int(a + 2, a + 30);
    const shag = a / nod(a, b);
    if (shag >= a) return null;
    return { a, b, h: shag * r.int(1, Math.floor((a - 1) / shag)) };
  },
  17: (r) => ({ a: r.int(4, 30) }),
  18: (r) => ({ k: r.int(4, 60) }),
  19: (r) => ({ s: 4 * r.int(3, 30), u: r.int(25, 55) }),
  20: (r) => ({ s: 4 * r.int(3, 30), u: r.int(25, 55) }),
  21: (r) => ({ s: r.int(2, 40), k: r.int(0, 2) }),
  22: (r) => {
    const a = r.int(2, 14);
    return { a, b: a + r.int(4, 16) };
  },
  23: (r) => {
    const cos = r.pick([0.1, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.7, 0.75, 0.8, 0.9, 0.35, 0.45, 0.15]);
    const l = r.int(4, 40);
    const c = 2 * l * cos;
    return Number.isInteger(c) ? { l, c } : null;
  },
  24: (r) => {
    const [n, d] = r.pick([
      [1, 2],
      [1, 4],
      [3, 4],
      [1, 5],
      [2, 5],
      [3, 5],
      [4, 5],
      [7, 25],
      [24, 25],
      [5, 13],
      [12, 13],
      [8, 17],
      [15, 17],
    ] as [number, number][]);
    return { bc: n * r.int(1, 8), n, d };
  },
  25: (r) => {
    const ab = r.pick([5, 10, 20, 25, 4, 8, 15, 30, 40, 50]);
    const bc = r.int(1, ab - 1);
    const [k, m] = koren(ab * ab - bc * bc);
    return { ab, k, m };
  },
  26: (r) => {
    const ab = r.pick([5, 10, 20, 25, 4, 8, 15, 30, 40, 50]);
    const ac = r.int(1, ab - 1);
    const [k, m] = koren(ab * ab - ac * ac);
    return { ab, k, m };
  },
  27: (r) => {
    const ab = r.pick([5, 10, 20, 25, 4, 8, 15, 30, 40, 50]);
    const ac = r.int(1, ab - 1);
    const [k, m] = koren(ab * ab - ac * ac);
    return { ab, k, m };
  },
  28: (r) => {
    /* sin B = x / d (конечная дробь); sin A = √(d² − x²) / d. */
    const d = r.pick([2, 4, 5, 10, 20, 25]);
    const x = r.int(1, d - 1);
    const [k, m] = koren(d * d - x * x);
    const g = nod(k, d);
    return m === 1 ? { n: k / g, d: d / g, m: 1, dec: 1 } : { n: k / g, d: d / g, m, dec: 0 };
  },
  29: (r) => {
    /* tg A = BC / AC: тройка (AC, BC, AB) или BC = √(AB² − AC²) с корнем. */
    const ac0 = r.int(1, 6);
    const ab0 = r.int(ac0 + 1, ac0 + 6);
    const [k, m] = koren(ab0 * ab0 - ac0 * ac0);
    const g = nod(k, ac0);
    return { ac: ac0 * r.int(1, 6), n: k / g, d: ac0 / g, m };
  },
  30: (r) => {
    const [cos, sin] = r.pick(PARY_SIN_COS);
    const ac = r.int(2, 30);
    const ch = Math.round(ac * sin * 100) / 100;
    const [n, d] = cos === 0.6 ? [3, 5] : cos === 0.8 ? [4, 5] : cos === 0.28 ? [7, 25] : [24, 25];
    return { hk: ch, hm: 1, n, d, m: 1, dec: r.int(0, 1) };
  },
  31: (r) => {
    const a = r.int(5, 40);
    const sin = r.pick([
      0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9,
    ]);
    const h = a * sin;
    return Number.isInteger(h) ? { a, h, k: r.int(0, 1) } : null;
  },
  32: (r) => {
    const c = r.int(4, 40);
    const cos = r.pick([0.05, 0.1, 0.12, 0.15, 0.2, 0.24, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5]);
    const m = c * cos;
    return Number.isInteger(m) ? { c, m } : null;
  },
  33: (r) => ({ d: r.int(15, 80), k: r.int(0, 1) }),
  34: (r) => {
    const k = r.int(0, 1);
    return { u: k ? r.int(15, 80) : chet(r, 30, 160), k };
  },
  35: (r) => {
    const d = r.pick([3, 4, 5, 6, 8, 9, 10, 12, 15, 18, 20, 24, 30, 36]);
    const n = r.int(1, d - 1);
    return nod(n, d) === 1 ? { n, d } : null;
  },
  36: (r) => {
    const ac = r.int(60, 180);
    const bc = r.int(40, 300 - ac);
    return (360 - ac - bc) % 2 === 0 ? { ac, bc } : null;
  },
  37: (r) => ({ u: r.int(15, 75), k: r.int(0, 1), v: 0 }),
  38: (r) => ({ u: r.int(15, 75) }),
  39: (r) => ({ g: r.int(30, 150) }),
  40: (r) => {
    const t = chet(r, 110, 250);
    const f = r.int(Math.max(15, t - 170), Math.floor(t / 2) - 8);
    return { f, t };
  },
  41: (r) => {
    const t = [r.int(3, 12), r.int(3, 12), r.int(3, 12), r.int(3, 12)];
    return {
      ab: t[0]! + t[1]!,
      bc: t[1]! + t[2]!,
      cd: t[2]! + t[3]!,
      da: t[3]! + t[0]!,
      k: r.int(0, 1),
    };
  },
  42: (r) => {
    const t = [r.int(3, 14), r.int(3, 14), r.int(3, 14), r.int(3, 14)];
    return { ab: t[0]! + t[1]!, bc: t[1]! + t[2]!, cd: t[2]! + t[3]!, da: t[3]! + t[0]!, k: 0 };
  },
  43: (r) => {
    const c = r.int(6, 30);
    const r2 = r.int(2, c - 2); // 2r
    return { c, per: 2 * (c + r2) };
  },
  44: (r) => {
    const c = r.int(5, 25);
    return { c, d: c + r.int(1, 12) };
  },
  45: (r) => {
    const abd = r.int(40, 80);
    return { abd, cad: r.int(25, Math.min(60, 150 - abd)), k: r.int(0, 1) };
  },
  46: (r) => {
    const abd = r.int(30, 70);
    return { abd, abc: abd + r.int(20, 60) };
  },
  47: (r) => ({ u: r.int(35, 145), k: r.int(0, 1) }),
  48: (r) => {
    const a = r.int(50, 120);
    const b = r.int(50, 120);
    return a + b === 180 ? null : { a, b, k: r.int(0, 1) };
  },
  49: (r) => {
    const [g, m] = r.pick([
      [120, 3],
      [135, 2],
      [150, 1],
    ] as [number, number][]);
    return { k: r.int(2, 20), m, g };
  },
  50: (r) => {
    const a = r.int(1, 9);
    const b = r.int(1, 9);
    const c = r.int(1, 9);
    return a === b && b === c ? null : { a, b, c, k: r.int(0, 1) };
  },
  51: (r) => {
    const e = r.int(60, 160);
    return { e, b: r.int(15, e - 15) };
  },
  52: (r) => {
    const a = r.int(35, 80);
    return { a, b: r.int(Math.max(92 - a, 35), 80) };
  },
  53: (r) => ({ m: r.int(3, 20), n: r.int(2, 20), u: r.int(45, 75) }),
  54: (r) => ({ a: r.int(2, 30) }),
  55: (r) => {
    const h = r.int(2, 20);
    const p = r.int(1, h * h);
    return (h * h) % p === 0 && p !== h ? { p, q: (h * h) / p } : null;
  },
  56: (r) => {
    /* Тройка, умноженная на k: высота ab/c — конечная дробь при большем выборе чисел. */
    const [a, b] = r.pick(TROYKI);
    const k = r.int(1, 3);
    return a * k <= 90 && b * k <= 90 ? { a: a * k, b: b * k } : null;
  },
  57: (r) => {
    const g = r.pick([60, 120]);
    const a = r.int(2, 45);
    const b = r.int(2, 45);
    const c2 = a * a + b * b - (g === 60 ? 1 : -1) * a * b;
    return Number.isInteger(Math.sqrt(c2)) && a !== b ? { a, b, g } : null;
  },
  58: (r) => {
    const m = r.int(1, 16);
    const n = m + r.int(2, 40);
    return Number.isInteger(Math.sqrt(m * n)) ? { m, n } : null;
  },
  59: (r) => {
    const [a, b, c] = r.pick(TROYKI);
    return { t: r.next() < 0.5 ? a : b, d: c };
  },
  60: (r) => ({ f: r.int(10, 85) }),
  61: (r) => {
    const k = r.int(1, 9);
    const m = k + r.int(1, 9);
    return { k, m };
  },
  /* Угол целый и чертёж читается (центральный угол не меньше порога):
     n ≤ 30, делитель 360. Две формулировки (v): угол между сторонами
     (n = 5 — образец) и центральный угол. */
  62: (r) => {
    const v = r.int(0, 1);
    const n = r.pick([3, 4, 5, 6, 8, 9, 10, 12, 15, 18, 20, 24, 30]);
    return v === 0 && n === 5 ? null : { n, v };
  },
  63: (r) => ({ per: 6 * r.int(2, 40) }),
  64: (r) => ({ h: 3 * r.int(2, 30) }),
  65: (r) => ({
    a: r.int(4, 30),
    b: r.int(4, 30),
    s: r.pick([0.2, 0.3, 0.4, 0.5, 0.6, 0.8, 0.25, 0.75]),
  }),
  66: (r) => ({ per: r.int(15, 80), r: r.int(1, 8) }),
  67: (r) => {
    const [a, b] = r.pick(TROYKI);
    return { a, b };
  },
  68: (r) => {
    const b = r.int(40, 150);
    const c = r.int(30, 260 - b);
    return (360 - b - c) % 2 === 0 ? { b, c } : null;
  },
  69: (r) => {
    const [a, b] = r.pick(TROYKI);
    return { a, b };
  },
  70: (r) => ({ h: r.int(2, 40) }),
  71: (r) => {
    const b = r.int(3, 30);
    return { a: b + 2 * r.int(1, 12), b };
  },
  72: (r) => ({ r: r.int(1, 30) }),
  73: (r) => ({ c: r.int(2, 40) }),
  74: (r) => {
    const k = r.int(1, 7);
    const n = r.int(1, 7);
    return { k, m: r.int(1, k + n - 1), n };
  },
  75: (r) => ({ e: r.int(40, 170), k: r.int(1, 7), m: r.int(1, 7) }),
};

/* ── Подбор ──────────────────────────────────────────────────────── */

export const ANALOGOV = 20;
/** Различных ответов среди аналогов прототипа — не меньше. */
export const RAZNYH_OTVETOV = 12;
/** Один ответ — не больше стольких аналогов. */
export const POVTOROV_OTVETA = 2;
const POPYTOK = 6000;

/**
 * Отпечаток задачи: числа условия и конфигурация. Поворот, отражение
 * и новые буквы чисел не меняют — та же фигура в другом положении
 * считается повтором. Числа берутся без имён параметров (как набор):
 * так повтором считается и та же фигура с переставленными ролями
 * чисел (отражённая), — проверка строже, чем нужно, а не слабее.
 */
export function otpechatok(id: number, p: Nabor): string {
  const chisla = Object.values(p)
    .map((x) => String(x))
    .sort();
  return `${id}|${chisla.join(';')}`;
}
/** Чертёж чист во всех режимах: движок не записал нарушений. */
export function chertezhChist(id: number, p: Params): boolean {
  const scena = prototip(id).stsena(p, POROG);
  const n = shagovPodskazki(scena);
  const rezhimy: Rezhim[] = [
    { rezhim: 'uchenik' },
    ...Array.from({ length: n }, (_, i) => ({ rezhim: 'podskazka' as const, shag: i + 1 })),
    { rezhim: 'uchitel' },
  ];
  return rezhimy.every((rezhim) => {
    const o = pustoyOtchet();
    renderPlan(scena, { rezhim }, o);
    return o.problems.length === 0;
  });
}

export interface Analog {
  proto: number;
  /** Номер аналога: 1–20. */
  no: number;
  params: Params;
}

/**
 * Подбор двадцати аналогов прототипа (детерминированно). Долгий:
 * каждый кандидат проверяется измерением и всеми режимами чертежа.
 * Его вызывает scripts/build-bank-1.mjs, результат лежит в
 * bank/analogi-dannye.ts; самотест сверяет файл с подбором заново.
 *
 * Правила: отпечаток не совпадает с задачей банка и с другим
 * аналогом; один ответ — не больше POVTOROV_OTVETA раз. Сначала
 * берутся наборы с новыми ответами, повторы — только когда новых
 * больше нет. Прототип, у которого различных ответов объективно
 * меньше RAZNYH_OTVETOV, попадает в исключения отчёта (iskluchenieAnalogov).
 */
export function podobratAnalogi(id: number): Analog[] {
  const p = prototip(id);
  const gen = GENERATORY[id];
  if (gen === undefined) throw new Error(`нет генератора аналогов прототипа ${id}`);
  const rng = rngOf(`analog-${id}`);
  const zanyato = new Set(
    zadachiPrototipa(id).map((z) => otpechatok(id, { ...p.primer, ...z.params })),
  );
  zanyato.add(otpechatok(id, p.primer));
  const skolko = new Map<number, number>();
  const out: Analog[] = [];
  const zapas: { a: Analog; o: number }[] = [];
  for (let i = 0; i < POPYTOK && out.length < ANALOGOV; i += 1) {
    const nabor = gen(rng);
    if (nabor === null) continue;
    const params = { ...p.primer, ...nabor } as Params;
    const key = otpechatok(id, params);
    if (zanyato.has(key)) continue;
    const o = p.otvet(params);
    if (!otvetEge(o)) continue;
    const okrugl = Math.round(o * 100) / 100;
    /* Ответ уже встречался дважды — такой набор не нужен вовсе. */
    if ((skolko.get(okrugl) ?? 0) >= POVTOROV_OTVETA) continue;
    const m = izmerit(id, params);
    if (m === null || Math.abs(m - o) > 1e-6 * Math.max(1, Math.abs(o))) continue;
    let chist = false;
    try {
      chist = chertezhChist(id, params);
    } catch {
      chist = false;
    }
    if (!chist) continue;
    zanyato.add(key);
    const a: Analog = { proto: id, no: 0, params };
    if (skolko.has(okrugl)) {
      /* Повтор ответа — в запас, пока ищутся новые ответы. */
      zapas.push({ a, o: okrugl });
      continue;
    }
    skolko.set(okrugl, 1);
    out.push(a);
  }
  for (const z of zapas) {
    if (out.length >= ANALOGOV) break;
    if ((skolko.get(z.o) ?? 0) >= POVTOROV_OTVETA) continue;
    skolko.set(z.o, (skolko.get(z.o) ?? 0) + 1);
    out.push(z.a);
  }
  return out.map((a, i) => ({ ...a, no: i + 1 }));
}

/**
 * Почему у прототипа не 20 аналогов или меньше 12 различных ответов —
 * для отчёта. null — правила выполнены.
 */
export function iskluchenieAnalogov(id: number, a: readonly Analog[]): string | null {
  const p = prototip(id);
  const otvety = new Map<number, number>();
  for (const x of a) {
    const o = Math.round(p.otvet(x.params) * 100) / 100;
    otvety.set(o, (otvety.get(o) ?? 0) + 1);
  }
  const prichiny: string[] = [];
  if (a.length < ANALOGOV) prichiny.push(`аналогов ${a.length} из ${ANALOGOV}`);
  if (otvety.size < RAZNYH_OTVETOV) prichiny.push(`различных ответов ${otvety.size}`);
  const chastyy = [...otvety.values()].some((n) => n > POVTOROV_OTVETA);
  if (chastyy) prichiny.push(`ответ встречается больше ${POVTOROV_OTVETA} раз`);
  return prichiny.length === 0 ? null : prichiny.join(', ');
}

/** Двадцать аналогов прототипа из файла данных. */
export function analogi(id: number): Analog[] {
  const p = prototip(id);
  return (ANALOGI_DANNYE[id] ?? []).map((nabor, i) => ({
    proto: id,
    no: i + 1,
    params: { ...p.primer, ...nabor } as Params,
  }));
}

/** Все аналоги всех прототипов. */
export function vseAnalogi(): Analog[] {
  return PROTOTIPY.flatMap((p) => analogi(p.id));
}
