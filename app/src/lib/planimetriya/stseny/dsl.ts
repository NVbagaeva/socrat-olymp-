/**
 * Короткая запись элементов сцены и общий тип прототипа чертежа.
 *
 * Прототип знает условие (формулировка ФИПИ с числами), ответ,
 * параметры первой задачи открытого банка и сцену — рисунок по тем
 * же числам. Случайные параметры здесь только для проверки движка:
 * числа «под ответ ЕГЭ» подбирает генератор банка.
 */

import type { Rng } from '../../veroyatnost/generator';
import type { DiapazonVarianta } from '../variant';
import type {
  EOtrezok,
  EUgol,
  Element,
  EMnogougolnik,
  EOblast,
  EOkruzhnost,
  EDuga,
  EPryamaya,
  EProdolzhenie,
  ETochka,
  Scena,
} from '../types';

/** Имена параметров прототипов: числа условия и номер конфигурации k. */
export type Kluch =
  | 'a'
  | 'b'
  | 'c'
  | 'd'
  | 'e'
  | 'f'
  | 'g'
  | 'h'
  | 'k'
  | 'l'
  | 'm'
  | 'n'
  | 'p'
  | 'q'
  | 'r'
  | 's'
  | 't'
  | 'u'
  | 'v'
  | 'ab'
  | 'ac'
  | 'bc'
  | 'cd'
  | 'da'
  | 'abc'
  | 'abd'
  | 'cad'
  | 'hk'
  | 'hm'
  | 'dec'
  | 'per';

/** Параметры задачи: у прототипа заданы только свои ключи. */
export type Params = Readonly<Record<Kluch, number>>;

/** Набор параметров, как его пишут в данных: только нужные ключи. */
export type Nabor = Partial<Record<Kluch, number>>;

export type Blok = 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI' | 'VII' | 'VIII' | 'IX' | 'X';

export interface PrototipChertezha {
  /** Номер прототипа: 1–49 — Блок 1 ФИПИ, 50 и дальше — дополнительные. */
  id: number;
  blok: Blok;
  nazvanie: string;
  /** Номера задач Блока 1 (Ширяева, ФИПИ); пусто — прототипа нет в Блоке 1. */
  fipi: readonly number[];
  /** Условие с формулами в $…$. */
  uslovie: (p: Params) => string;
  /** Ответ задачи. */
  otvet: (p: Params) => number;
  /** Параметры первой задачи открытого банка (или образца). */
  primer: Nabor;
  /** Случайные параметры для автотеста движка. */
  sluchaynye: (rng: Rng) => Nabor;
  /** Сцена по числам условия; porog — порог схематичного рисунка. */
  stsena: (p: Params, porog: number) => Scena;
  /** Поворот и отражение в генераторе вариантов. */
  diapazon?: DiapazonVarianta;
}

type Opts<T> = Omit<T, 'tip' | 'a' | 'b' | 'v' | 'tochki' | 'okr' | 't' | 'ot' | 'do'>;

export const tri = (
  a: string,
  b: string,
  c: string,
  o: Opts<EMnogougolnik> = {},
): EMnogougolnik => ({
  tip: 'mnogougolnik',
  tochki: [a, b, c],
  ...o,
});
export const mn = (tochki: readonly string[], o: Opts<EMnogougolnik> = {}): EMnogougolnik => ({
  tip: 'mnogougolnik',
  tochki,
  ...o,
});
export const otr = (a: string, b: string, o: Opts<EOtrezok> = {}): EOtrezok => ({
  tip: 'otrezok',
  a,
  b,
  ...o,
});
export const ug = (a: string, v: string, b: string, o: Opts<EUgol> = {}): EUgol => ({
  tip: 'ugol',
  a,
  v,
  b,
  ...o,
});
export const pryam = (a: string, v: string, b: string, o: Opts<EUgol> = {}): EUgol => ({
  tip: 'ugol',
  a,
  v,
  b,
  pryamoy: true,
  ...o,
});
export const okr = (o0: string, o: Opts<EOkruzhnost> = {}): EOkruzhnost => ({
  tip: 'okruzhnost',
  okr: o0,
  ...o,
});
export const duga = (o0: string, ot: string, d: string, o: Opts<EDuga> = {}): EDuga => ({
  tip: 'duga',
  okr: o0,
  ot,
  do: d,
  ...o,
});
export const tochka = (t: string, o: Opts<ETochka> = {}): ETochka => ({ tip: 'tochka', t, ...o });
export const oblast = (tochki: readonly string[], o: Opts<EOblast> = {}): EOblast => ({
  tip: 'oblast',
  tochki,
  ...o,
});
export const pryamaya = (a: string, b: string, o: Opts<EPryamaya> = {}): EPryamaya => ({
  tip: 'pryamaya',
  a,
  b,
  ...o,
});
export const prod = (a: string, b: string, o: Opts<EProdolzhenie> = {}): EProdolzhenie => ({
  tip: 'prodolzhenie',
  a,
  b,
  ...o,
});

/** Число для чертежа и условия: запятая, без лишних нулей. */
export function chislo(x: number): string {
  const r = Math.round(x * 10000) / 10000;
  return String(r).replace('.', ',').replace('-', '−');
}

/** Градусы для подписи на чертеже: «37°». */
export const gr = (x: number) => `${chislo(x)}°`;

/** Градусы в TeX: «37^\circ». */
export const grTex = (x: number) => `${chislo(x).replace(',', '{,}')}^\\circ`;

/** Число в TeX: десятичная запятая в фигурных скобках. */
export const tex = (x: number) => chislo(x).replace(',', '{,}');

/**
 * Высота из P на прямую AB с основанием F: отрезок PF, значок
 * прямого угла и, если F за пределами отрезка AB, продолжение
 * стороны пунктиром до F. Элементы — в слое sloy.
 */
export function vysota(
  p: string,
  a: string,
  b: string,
  f: string,
  vneOtrezka: 'a' | 'b' | null,
  o: {
    sloy?: Element['sloy'];
    vydelit?: Element['vydelit'];
    znachenie?: string;
    otvet?: boolean;
  } = {},
): Element[] {
  const out: Element[] = [otr(p, f, o)];
  /* Значок прямого угла — со стороны отрезка AB (к ближней его точке внутри). */
  const k = vneOtrezka === 'b' ? a : vneOtrezka === 'a' ? b : a;
  out.push(pryam(p, f, k, { sloy: o.sloy }));
  if (vneOtrezka === 'b') out.push(prod(a, b, { doTochki: f, sloy: o.sloy }));
  if (vneOtrezka === 'a') out.push(prod(b, a, { doTochki: f, sloy: o.sloy }));
  return out;
}

/**
 * Делит остаток суммы между двумя углами в прежней пропорции так,
 * чтобы каждый был не меньше порога.
 */
export function razdelit(ostatok: number, x: number, y: number, porog: number): [number, number] {
  let a = (ostatok * x) / (x + y);
  a = Math.min(Math.max(a, porog), ostatok - porog);
  return [a, ostatok - a];
}

export const clamp = (x: number, lo: number, hi: number) => Math.min(Math.max(x, lo), hi);

/** Вспомогательная: сцена с проверкой «углы не меньше порога» и пометкой схематичности. */
export function scena(s: Scena, skhematichno: boolean): Scena {
  return skhematichno ? { ...s, skhematichno: true } : s;
}

/** Штрихи равенства на стороне, уже нарисованной многоугольником. */
export const shtrih = (a: string, b: string, n: 1 | 2 | 3, o: Opts<EOtrezok> = {}): EOtrezok => ({
  tip: 'otrezok',
  a,
  b,
  shtrihi: n,
  tolkoShtrihi: true,
  ...o,
});

/** k√m в TeX (m = 1 — просто k; k = 1 — просто √m). */
export function korenTex(k: number, m = 1): string {
  if (m === 1) return tex(k);
  return `${k === 1 ? '' : tex(k)}\\sqrt{${m}}`;
}

/** k√m для подписи на чертеже. */
export function koren(k: number, m = 1): string {
  if (m === 1) return chislo(k);
  return `${k === 1 ? '' : chislo(k)}√${m}`;
}

/** Дробь n√m / d в TeX; dec — записать десятичной дробью. */
export function drobTex(n: number, d: number, m = 1, dec = false): string {
  if (dec) return tex((n * Math.sqrt(m)) / d);
  if (d === 1) return korenTex(n, m);
  return `\\frac{${korenTex(n, m)}}{${d}}`;
}
