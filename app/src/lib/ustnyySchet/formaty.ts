/**
 * Фиксированные форматы — те, что пойдут в рейтинг. У каждого свой
 * простой генератор: правила подбора чисел здесь короткие, чтобы
 * сервер (этап рейтинга) повторил их один в один, а сверка сложности
 * шла по одной таблице диапазонов (formatyCases.json).
 *
 * Разбор примера формата — разбор того приёма, которым он решается:
 * пример собирается через priyom(...).iz(...).
 */

import { estPriyom, priyom } from './registry';
import type { Rng } from './rng';
import type { Primer } from './types';
import type { Istochnik } from './nabor';

export type FormatId =
  'tablica-1m' | 'slozh-vych-100-1m' | 'umn-del-2x1-2m' | 'kvadraty-20' | 'miks-ege-3m';

export interface Format {
  id: FormatId;
  /** Время на всё (на время) или число примеров (серия). */
  tip: 'vremya' | 'seriya';
  sek?: number;
  n?: number;
  istochnik: Istochnik;
}

/* ── Генераторы форматов ───────────────────────────────────── */

function tablica1m(rng: Rng): Primer {
  const a = rng.int(2, 9);
  const b = rng.int(2, 9);
  return priyom('tablica').iz([String(a), String(b)], 2);
}

function slozhVych100(rng: Rng): Primer {
  if (rng.chance(0.5)) {
    const a = rng.int(11, 89);
    const b = rng.int(11, Math.max(11, 100 - a));
    return priyom('po-razryadam').iz([String(a), String(Math.min(b, 100 - a))], 1, '+');
  }
  const a = rng.int(21, 100);
  const b = rng.int(11, a - 1);
  return priyom('po-razryadam').iz([String(a), String(b)], 1, '-');
}

function umnDel2x1(rng: Rng): Primer {
  const k = rng.int(2, 9);
  let x = rng.int(12, 99);
  if (x % 10 === 0) x += 1;
  if (rng.chance(0.5)) return priyom('razlozhenie').iz([String(x), String(k)], 1);
  return priyom('delenie-po-chastyam').iz([String(x * k), String(k)], 1);
}

/** Пул квадратов: 11–30, на 5 до 95, 41–59, 91–109. */
export const KVADRATY_PUL: readonly number[] = [
  ...Array.from({ length: 20 }, (_, i) => 11 + i),
  35,
  45,
  55,
  65,
  75,
  85,
  95,
  ...Array.from({ length: 19 }, (_, i) => 41 + i),
  ...Array.from({ length: 19 }, (_, i) => 91 + i).filter((n) => n !== 100),
].filter((n, i, all) => all.indexOf(n) === i);

/** Квадрат числа — пример того приёма, которым его удобнее всего считать. */
export function kvadratPrimer(n: number): Primer {
  if (n >= 11 && n <= 30) return priyom('kvadraty-11-30').iz([String(n)], 2);
  if (n % 10 === 5) return priyom('kvadrat-na-5').iz([String((n - 5) / 10)], 2);
  if (n >= 41 && n <= 59) return priyom('kvadrat-okolo-50').iz([String(n - 50)], 2);
  return priyom('kvadrat-okolo-kruglyh').iz(['100', String(n - 100)], 2);
}

function kvadraty20(rng: Rng): Primer {
  return kvadratPrimer(rng.pick(KVADRATY_PUL));
}

const MIKS_ZNAM = [2, 4, 5, 8, 20, 25] as const;

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function miksEge(rng: Rng): Primer | null {
  const t = rng.int(0, 4);
  if (t === 0 || t === 1) {
    const b = rng.pick(MIKS_ZNAM);
    let a = rng.int(1, b - 1);
    while (gcd(a, b) !== 1) a = rng.int(1, b - 1);
    return priyom('doli-procenty').iz([String(a), String(b)], 2, t === 0 ? 'fd' : 'fp');
  }
  if (t === 2) {
    return priyom('procent-ot-chisla').sozdat(rng, {
      uroven: rng.chance(0.5) ? 1 : 2,
      desyatichnye: false,
      otricatelnye: false,
    });
  }
  if (t === 3) {
    return priyom('otricatelnye').sozdat(rng, {
      uroven: 2,
      desyatichnye: false,
      otricatelnye: true,
    });
  }
  return priyom('desyatichnye-umnozhenie').sozdat(rng, {
    uroven: 1,
    desyatichnye: true,
    otricatelnye: false,
  });
}

export const FORMATY: readonly Format[] = [
  { id: 'tablica-1m', tip: 'vremya', sek: 60, istochnik: tablica1m },
  { id: 'slozh-vych-100-1m', tip: 'vremya', sek: 60, istochnik: slozhVych100 },
  { id: 'umn-del-2x1-2m', tip: 'vremya', sek: 120, istochnik: umnDel2x1 },
  { id: 'kvadraty-20', tip: 'seriya', n: 20, istochnik: kvadraty20 },
  { id: 'miks-ege-3m', tip: 'vremya', sek: 180, istochnik: miksEge },
];

export function format(id: string): Format | undefined {
  return FORMATY.find((f) => f.id === id);
}

/* ── Рейтинг ───────────────────────────────────────────────────── */

/** Форматы рейтинга: пять зачётных и «Вызов дня» (его примеры — только с сервера). */
export type ReytingFormatId = FormatId | 'vyzov-dnya';

export interface ReytingFormat {
  id: ReytingFormatId;
  tip: 'vremya' | 'seriya';
  sek?: number;
  n?: number;
}

export const REYTING_FORMATY: readonly ReytingFormat[] = [
  { id: 'vyzov-dnya', tip: 'seriya', n: 20 },
  ...FORMATY.map(({ id, tip, sek, n }) => ({
    id,
    tip,
    ...(sek === undefined ? {} : { sek }),
    ...(n === undefined ? {} : { n }),
  })),
];

export function reytingFormat(id: string): ReytingFormat | undefined {
  return REYTING_FORMATY.find((f) => f.id === id);
}

/**
 * Пример, выданный сервером (priyom, d, v), — в пример приёма: запись
 * для экрана и разбор считает сайт. null — сервер прислал незнакомый
 * приём.
 */
export function primerIzServera(s: {
  priyom: string;
  d: readonly string[];
  v: string | null;
}): Primer | null {
  if (!estPriyom(s.priyom)) return null;
  return priyom(s.priyom).iz(s.d, 2, s.v ?? undefined);
}
