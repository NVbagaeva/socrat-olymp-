/**
 * Живые сцены блока «Понятие производной» (теория №8, папка
 * zadaniya/proizvodnaya): секущая → касательная, мгновенная скорость,
 * модуль в нуле. Числа и функции — те же, что у статичных рисунков
 * (lib/proizvodnaya/stsenyPonyatiya.ts: SEK, SKOROST, MODUL), здесь —
 * только ход по шкале приращений и строки таблиц. Проверка —
 * scripts/check-zhivye.mjs.
 *
 * Модельное время сцены — номер значения на шкале: t = 0 — первое
 * значение, t = n − 1 — последнее. Между соседними значениями приращение
 * меняется по логарифму (4 → 3 → … → 0,01): ближе к нулю шаги мельче,
 * и движение само замедляется, а на каждом значении шкалы — пауза-снимок
 * с точными числами в таблице.
 */

import { MODUL, SEK, SKOROST } from '@/lib/proizvodnaya/stsenyPonyatiya';
import type { HodOpcii } from './hod';

/** Значение шкалы в момент t: по логарифму между соседями (одного знака). */
export function naShkale(shkala: readonly number[], t: number): number {
  const n = shkala.length;
  const tt = Math.min(Math.max(t, 0), n - 1);
  const i = Math.min(Math.floor(tt), n - 2);
  const u = tt - i;
  const a = shkala[i] as number;
  const b = shkala[i + 1] as number;
  if (u <= 0) return a;
  if (u >= 1) return b;
  if (a * b > 0) {
    const s = Math.sign(a);
    return s * Math.exp(Math.log(Math.abs(a)) * (1 - u) + Math.log(Math.abs(b)) * u);
  }
  /* Смена знака (модуль): линейно через ноль. */
  return a + (b - a) * u;
}

/** Опции хода: снимок на каждом значении шкалы. */
export function hodShkaly(shkala: readonly number[], sekNaShag: number): HodOpcii {
  const n = shkala.length;
  return {
    tMax: n - 1,
    ostanovki: Array.from({ length: n - 2 }, (_, i) => i + 1),
    sekNaEd: sekNaShag,
    sekSnimok: 1.2,
    razgon: 0.35,
  };
}

/** Сколько значений шкалы уже пройдено к моменту t (строки таблицы). */
export function proydenoZnacheniy(t: number): number {
  return Math.floor(t + 1e-9) + 1;
}

/* ── Секущая → касательная ── */

export const SEKUSHCHAYA = {
  shkala: SEK.shkala,
  f: SEK.f,
  x0: SEK.x0,
  y0: SEK.f(SEK.x0),
  tgAlpha: SEK.tgAlpha,
  hod: hodShkaly(SEK.shkala, 1.6),
  /** Окно графика. */
  okno: { xmin: -1, xmax: 9, ymin: 0, ymax: 11 },
  stroka(dx: number) {
    return { dx, df: SEK.f(SEK.x0 + dx) - SEK.f(SEK.x0), tg: SEK.tgBeta(dx) };
  },
} as const;

/* ── Мгновенная скорость ── */

export const SKOROST8 = {
  shkala: SKOROST.shkala,
  s: SKOROST.s,
  t0: SKOROST.t0,
  v: SKOROST.v,
  hod: hodShkaly(SKOROST.shkala, 1.6),
  /** Дорога: от 0 до 8 м (s(4) = 8). */
  dlina: 8,
  /** Спидометр: шкала 0…4 м/с. */
  vMax: 4,
  stroka(dt: number) {
    const s0 = SKOROST.s(SKOROST.t0);
    return { dt, ds: SKOROST.s(SKOROST.t0 + dt) - s0, vSr: SKOROST.vSr(dt) };
  },
} as const;

/* ── Модуль: скачок отношения ── */

/** Шкала показа: справа к нулю, потом слева от нуля наружу. */
export const MODUL8_SHKALA: readonly number[] = [
  ...MODUL.shkala.filter((x) => x > 0).sort((a, b) => b - a),
  ...MODUL.shkala.filter((x) => x < 0).sort((a, b) => b - a),
];

export const MODUL8 = {
  shkala: MODUL8_SHKALA,
  hod: hodShkaly(MODUL8_SHKALA, 1.4),
  okno: { xmin: -2.6, xmax: 2.6, ymin: -0.6, ymax: 2.6 },
  stroka(dx: number) {
    return { dx, dy: Math.abs(dx), otn: Math.abs(dx) / dx };
  },
} as const;

/** Число шкалы — как в таблице: до сотых, без лишних нулей. */
export function okruglit(x: number): number {
  return Math.round(x * 100) / 100;
}
