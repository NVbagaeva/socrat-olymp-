/**
 * Живая сцена «Как гасится кредит» (теория №16, экономическая задача,
 * глава «Две схемы кредита»): каждый год долг сначала растёт на r %,
 * затем платёж срезает с него кусок — проценты и часть долга. Кусок
 * уезжает в столбик платежей года. Две схемы: дифференцированная
 * (долг убывает равными частями) и аннуитетная (платежи равны).
 *
 * Модельное время t — годы: t ∈ [i; i + 1] — год i + 1. Внутри года:
 * доля u ≤ NACHISLENIE — начисление процентов, u ≥ PLATEZH — платёж.
 * Проверка — scripts/check-zhivye.mjs.
 */

import type { HodOpcii } from './hod';

export type Shema = 'dif' | 'ann';

export interface God {
  /** Долг в начале года, после начисления, в конце года. */
  dolg: number;
  posleProcentov: number;
  ostatok: number;
  procenty: number;
  /** Часть платежа, которая гасит долг. */
  osnovnoy: number;
  platezh: number;
}

export interface Kredit {
  shema: Shema;
  S: number;
  /** Ставка, %. */
  r: number;
  n: number;
  gody: God[];
}

/** Округление до сотых: убирает хвосты двоичной арифметики. */
function okr(x: number): number {
  return Math.round(x * 100) / 100;
}

/**
 * Дифференцированный: S = 8 млн, 10 %, 4 года — долг 8 → 6 → 4 → 2 → 0.
 * Аннуитетный: S = 4641 тыс., 10 %, 4 года — платёж 1464,1, долг
 * 4641 → 3641 → 2541 → 1331 → 0 (основная часть растёт ×1,1).
 */
export function kredit(shema: Shema): Kredit {
  const r = 10;
  const n = 4;
  const k = 1 + r / 100;
  const S = shema === 'dif' ? 8 : 4641;
  const X = shema === 'ann' ? okr((S * k ** n * (k - 1)) / (k ** n - 1)) : 0;
  const gody: God[] = [];
  let dolg = S;
  for (let i = 0; i < n; i += 1) {
    const procenty = okr(dolg * (k - 1));
    const posleProcentov = okr(dolg + procenty);
    const osnovnoy = shema === 'dif' ? okr(S / n) : okr(X - procenty);
    const platezh = okr(procenty + osnovnoy);
    const ostatok = okr(posleProcentov - platezh);
    gody.push({ dolg, posleProcentov, ostatok, procenty, osnovnoy, platezh });
    dolg = ostatok;
  }
  return { shema, S, r, n, gody };
}

export const NACHISLENIE = 0.35;
export const PLATEZH = 0.45;

export function hodKredita(k: Kredit): HodOpcii {
  return {
    tMax: k.n,
    ostanovki: Array.from({ length: k.n - 1 }, (_, i) => i + 1),
    sekNaEd: 2.4,
    sekSnimok: 2.2,
    razgon: 0.15,
  };
}

/** Плавность внутри фазы. */
export function plavno(u: number): number {
  const v = Math.min(1, Math.max(0, u));
  return v < 0.5 ? 2 * v * v : 1 - (-2 * v + 2) ** 2 / 2;
}

export interface Sostoyanie {
  /** Номер текущего года (0…n−1) и доля прохода внутри него. */
  god: number;
  u: number;
  /** Высота столбика долга сейчас. */
  dolg: number;
  /** Насколько начислены проценты текущего года (0…1). */
  nachisleno: number;
  /** Насколько платёж текущего года доехал до своего столбика (0…1). */
  edet: number;
  /** Сколько столбиков платежей уже стоят на месте. */
  gotovo: number;
}

export function sostoyanie(k: Kredit, t: number): Sostoyanie {
  if (t >= k.n - 1e-9) {
    return { god: k.n - 1, u: 1, dolg: 0, nachisleno: 1, edet: 1, gotovo: k.n };
  }
  const god = Math.max(0, Math.floor(t + 1e-9));
  const u = t - god;
  const g = k.gody[god] as God;
  const nachisleno = plavno(u / NACHISLENIE);
  const edet = u <= PLATEZH ? 0 : plavno((u - PLATEZH) / (1 - PLATEZH));
  const dolg = edet > 0 ? g.ostatok : g.dolg + g.procenty * nachisleno;
  return { god, u, dolg, nachisleno, edet, gotovo: god };
}

export function itogo(k: Kredit): { vsego: number; pereplata: number } {
  const vsego = okr(k.gody.reduce((s, g) => s + g.platezh, 0));
  return { vsego, pereplata: okr(vsego - k.S) };
}
