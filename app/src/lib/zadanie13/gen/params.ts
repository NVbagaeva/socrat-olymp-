/**
 * Параметры листа генератора №13 и их запись в адрес.
 *
 * Модуль лёгкий, без движка: им пользуются экран генератора (до
 * генерации), страницы печати и онлайн-набор. Лист ученика, лист
 * учителя и онлайн-версия строятся из одного адреса: состав, уровень,
 * источник, вид листа, seed комплекта и замены. Ответов в адресе нет.
 */

import { VIDY_13, type Vid13 } from '@/content/generator13';

export type Uroven13 = 'base' | 'all' | 'hard';
export type IstochnikGen13 = 'bank' | 'mix' | 'new';
export type Pomoshch13 = 'net' | 'ramka';
export type VidLista13 = 'compact' | 'full';
export type ListUchitelya13 = 'otvety' | 'kratko' | 'polno';

export interface GenParams13 {
  sostav: Partial<Record<Vid13, number>>;
  uroven: Uroven13;
  istochnik: IstochnikGen13;
  pomoshch: Pomoshch13;
  vid: VidLista13;
  variants: number;
  /** Пресет «Зачёт Н.В.»: страница с баллами, задачи по одной на страницу. */
  zachet: boolean;
  title: string;
  date: string;
  teacher: string;
  uchitel: ListUchitelya13;
  theme: 'color' | 'print';
  seed: string;
  /** Замены задач: «вариант.номер» → сколько раз заменяли. */
  zameny: Record<string, number>;
}

export const VIDY_ID: readonly Vid13[] = VIDY_13.map((v) => v.id);

export const GEN_PARAMS_13: GenParams13 = {
  sostav: { A: 2, B: 1, C: 2, D: 1 },
  uroven: 'base',
  istochnik: 'mix',
  pomoshch: 'net',
  vid: 'compact',
  variants: 1,
  zachet: false,
  title: 'Домашняя работа',
  date: '',
  teacher: 'Багаева Н.В.',
  uchitel: 'kratko',
  theme: 'color',
  seed: '',
  zameny: {},
};

export function vsegoZadach13(p: Pick<GenParams13, 'sostav'>): number {
  return VIDY_ID.reduce((s, id) => s + (p.sostav[id] ?? 0), 0);
}

export function minut13(p: Pick<GenParams13, 'sostav'>): number {
  return VIDY_13.reduce((s, v) => s + (p.sostav[v.id] ?? 0) * v.minut, 0);
}

function oneOf<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

/** Параметры → строка адреса (без «?»). */
export function genQuery13(p: GenParams13): string {
  const q = new URLSearchParams();
  q.set(
    's',
    VIDY_ID.filter((id) => (p.sostav[id] ?? 0) > 0)
      .map((id) => `${id}:${p.sostav[id]}`)
      .join(','),
  );
  /* «u» занят номером урока в комплектах (lib/komplekt.ts) — уровень под «l». */
  q.set('l', p.uroven);
  q.set('i', p.istochnik);
  q.set('h', p.pomoshch);
  q.set('f', p.vid);
  q.set('v', String(p.variants));
  if (p.zachet) q.set('zc', '1');
  if (p.title) q.set('tt', p.title);
  if (p.date) q.set('d', p.date);
  if (p.teacher) q.set('tc', p.teacher);
  q.set('a', p.uchitel);
  q.set('t', p.theme);
  q.set('seed', p.seed);
  const z = Object.entries(p.zameny)
    .filter(([, k]) => k > 0)
    .map(([pos, k]) => `${pos}:${k}`)
    .join(',');
  if (z) q.set('z', z);
  return q.toString();
}

/** Адрес → параметры. Непонятное — по умолчанию; лишнее отбрасывается. */
export function parseGenQuery13(q: URLSearchParams | { get(name: string): string | null }): GenParams13 {
  const sostav: Partial<Record<Vid13, number>> = {};
  for (const part of (q.get('s') ?? '').split(',')) {
    const [id, n] = part.split(':');
    const vid = VIDY_13.find((v) => v.id === id);
    const k = Number(n);
    if (vid && Number.isInteger(k) && k > 0) sostav[vid.id] = Math.min(k, vid.max);
  }
  const zameny: Record<string, number> = {};
  for (const part of (q.get('z') ?? '').split(',')) {
    const [pos, k] = part.split(':');
    const n = Number(k);
    if (pos && /^\d+\.\d+$/.test(pos) && Number.isInteger(n) && n > 0) zameny[pos] = n;
  }
  const v = Number(q.get('v'));
  return {
    sostav,
    uroven: oneOf(q.get('l'), ['base', 'all', 'hard'] as const, 'all'),
    istochnik: oneOf(q.get('i'), ['bank', 'mix', 'new'] as const, 'mix'),
    pomoshch: oneOf(q.get('h'), ['net', 'ramka'] as const, 'net'),
    vid: oneOf(q.get('f'), ['compact', 'full'] as const, 'compact'),
    variants: Number.isInteger(v) && v >= 1 && v <= 4 ? v : 1,
    zachet: q.get('zc') === '1',
    title: (q.get('tt') ?? '').slice(0, 80),
    date: (q.get('d') ?? '').slice(0, 20),
    teacher: (q.get('tc') ?? '').slice(0, 60),
    uchitel: oneOf(q.get('a'), ['otvety', 'kratko', 'polno'] as const, 'kratko'),
    theme: oneOf(q.get('t'), ['color', 'print'] as const, 'color'),
    seed: (q.get('seed') ?? '').slice(0, 40),
    zameny,
  };
}

export const BASE_13 = '/zadaniya/13';

/** Адреса листов и онлайн-набора по параметрам. */
export function listHref13(p: GenParams13, vid: 'uchenik' | 'uchitel' | 'vse'): string {
  const hvost = vid === 'uchenik' ? '' : vid === 'uchitel' ? 'otvety/' : 'vse/';
  return `${BASE_13}/pechat/${hvost}?${genQuery13(p)}`;
}

export function onlaynHref13(p: GenParams13): string {
  return `${BASE_13}/nabor/?${genQuery13(p)}`;
}
