/**
 * Параметры листа генератора №13 и их запись в адрес.
 *
 * Модуль лёгкий, без движка: им пользуются экран генератора (до
 * генерации), страницы печати и онлайн-набор. Лист ученика, лист
 * учителя и онлайн-версия строятся из одного адреса: состав, уровень,
 * источник, вид листа, seed комплекта и замены. Ответов в адресе нет.
 */

import { VIDY_13, type Vid13 } from '@/content/generator13';
import { UROKI_13, type Urok13 } from '@/content/repetitory13';
import { razobratSostav, slotySostava, sostavStroka } from '@/lib/generator/obshchiy/klyuchi';
import { BANK_13 } from '../bank';

/** Прототипы движка: у каждого задачи в банке — так модуль остаётся без движка. */
const PROTOTIPY_13 = new Set(BANK_13.map(([id]) => id));

/** Опорные блоки «таблица руками» (прототипы P-…): вид «С таблицей». */
const TABLITSA_RUKAMI: readonly string[] = ['o13-01', 'o13-02', 'o13-03'];

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
  /** Пресет «Зачёт»: страница с баллами, задачи по одной на страницу. */
  zachet: boolean;
  title: string;
  date: string;
  teacher: string;
  uchitel: ListUchitelya13;
  theme: 'color' | 'print';
  seed: string;
  /** Замены задач: «вариант.номер» → сколько раз заменяли. */
  zameny: Record<string, number>;
  /** Урок вкладки «Для репетиторов» (1–6): состав задаёт урок, а не «Что»; 0 — не урок. */
  urok: number;
  /**
   * Схема ps=2 (общий генератор): состав по прототипам («A-01», «T» —
   * «Определи тип»), задача привязана к ключу позиции «A-01_0», замены —
   * «вариант.ключ». Нет поля — прежний адрес: задача по номеру на листе.
   */
  klyuchi?: { id: string; n: number; k?: number }[];
  /** QR на листе ученика (ps=2); в прежних адресах QR есть всегда. */
  qr?: boolean;
}

/** Прототип «A-01», «P-03» или «T» — подтип «Определи тип». */
export const PODTIP_RE_13 = /[A-DP]-\d{2}|T/;

/** Состав по видам из состава по прототипам: для числа задач и минут. */
export function sostavIzKlyuchey13(
  klyuchi: readonly { id: string; n: number; k?: number }[],
): Partial<Record<Vid13, number>> {
  const out: Partial<Record<Vid13, number>> = {};
  for (const s of slotySostava(klyuchi)) {
    const vid = (s.id === 'T' ? 'T' : s.id.startsWith('P-') ? 'P' : s.id[0]) as Vid13;
    out[vid] = (out[vid] ?? 0) + 1;
  }
  return out;
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
  urok: 0,
};

export function urokPo13(no: number): Urok13 | undefined {
  return UROKI_13.find((u) => u.no === no);
}

/** Состав урока по видам: опорные блоки 1–3 — «таблица руками», остальное — тип урока. */
export function sostavUroka13(u: Urok13): Partial<Record<Vid13, number>> {
  const out: Partial<Record<Vid13, number>> = {};
  const plus = (vid: Vid13, n: number) => {
    if (n > 0) out[vid] = (out[vid] ?? 0) + n;
  };
  for (const id of u.opornye) plus(TABLITSA_RUKAMI.includes(id) ? 'P' : u.chto, 1);
  plus(u.chto, u.bank.length + u.novye.length);
  plus('T', u.tip);
  return out;
}

function sostavOf(
  p: Pick<GenParams13, 'sostav'> & { urok?: number },
): Partial<Record<Vid13, number>> {
  const u = p.urok ? urokPo13(p.urok) : undefined;
  return u === undefined ? p.sostav : sostavUroka13(u);
}

export function vsegoZadach13(p: Pick<GenParams13, 'sostav'> & { urok?: number }): number {
  const sostav = sostavOf(p);
  return VIDY_ID.reduce((s, id) => s + (sostav[id] ?? 0), 0);
}

export function minut13(p: Pick<GenParams13, 'sostav'> & { urok?: number }): number {
  const sostav = sostavOf(p);
  return VIDY_13.reduce((s, v) => s + (sostav[v.id] ?? 0) * v.minut, 0);
}

function oneOf<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

/** Параметры → строка адреса (без «?»). */
export function genQuery13(p: GenParams13): string {
  if (p.klyuchi !== undefined) return queryPoKlyucham13(p, p.klyuchi);
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
  /* Урок серии — как у №9: номер с нуля под «u», общий код у всех уроков. */
  if (p.urok > 0) q.set('u', String(p.urok - 1));
  const z = Object.entries(p.zameny)
    .filter(([, k]) => k > 0)
    .map(([pos, k]) => `${pos}:${k}`)
    .join(',');
  if (z) q.set('z', z);
  return q.toString();
}

/** Адрес ps=2: ps=2&s=A-01:2,T:3&l=all&i=mix&…&seed=…&qr=1&z=1.A-01_0:1. */
function queryPoKlyucham13(p: GenParams13, klyuchi: GenParams13['klyuchi'] & object): string {
  const q = new URLSearchParams();
  q.set('ps', '2');
  q.set('s', sostavStroka(klyuchi));
  q.set('l', p.uroven);
  q.set('i', p.istochnik);
  if (p.pomoshch === 'ramka') q.set('h', p.pomoshch);
  if (p.vid === 'full') q.set('f', p.vid);
  if (p.variants > 1) q.set('v', String(p.variants));
  if (p.zachet) q.set('zc', '1');
  if (p.title) q.set('tt', p.title);
  if (p.date) q.set('d', p.date);
  if (p.teacher) q.set('tc', p.teacher);
  q.set('a', p.uchitel);
  if (p.theme !== 'color') q.set('t', p.theme);
  q.set('seed', p.seed);
  if (p.qr === true) q.set('qr', '1');
  const z = Object.entries(p.zameny)
    .filter(([, k]) => k > 0)
    .map(([pos, k]) => `${pos}:${k}`)
    .join(',');
  if (z) q.set('z', z);
  return q.toString();
}

const ZAMENA_PS2_RE = new RegExp(`^\\d\\.(?:${PODTIP_RE_13.source})_\\d{1,2}$`);

/** Адрес → параметры. Непонятное — по умолчанию; лишнее отбрасывается. */
export function parseGenQuery13(
  q: URLSearchParams | { get(name: string): string | null },
): GenParams13 {
  if (q.get('ps') === '2') return parsePoKlyucham13(q);
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
  const u = q.get('u') === null ? NaN : Number(q.get('u')) + 1;
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
    urok: urokPo13(u) === undefined ? 0 : u,
  };
}

/** Адрес ps=2. Прототипа нет в движке — позиция отбрасывается. */
function parsePoKlyucham13(q: { get(name: string): string | null }): GenParams13 {
  const est = (id: string) => id === 'T' || PROTOTIPY_13.has(id);
  const klyuchi = razobratSostav(q.get('s') ?? '', true, PODTIP_RE_13, est);
  const zameny: Record<string, number> = {};
  for (const part of (q.get('z') ?? '').split(',')) {
    const [pos, k] = part.split(':');
    const n = Number(k);
    if (pos && ZAMENA_PS2_RE.test(pos) && Number.isInteger(n) && n > 0 && n < 1000) {
      zameny[pos] = n;
    }
  }
  const v = Number(q.get('v') ?? 1);
  const d = q.get('d') ?? '';
  return {
    sostav: sostavIzKlyuchey13(klyuchi),
    klyuchi,
    uroven: oneOf(q.get('l'), ['base', 'all', 'hard'] as const, 'all'),
    istochnik: oneOf(q.get('i'), ['bank', 'mix', 'new'] as const, 'mix'),
    pomoshch: oneOf(q.get('h'), ['net', 'ramka'] as const, 'net'),
    vid: oneOf(q.get('f'), ['compact', 'full'] as const, 'compact'),
    variants: Number.isInteger(v) && v >= 1 && v <= 4 ? v : 1,
    zachet: q.get('zc') === '1',
    title: (q.get('tt') ?? '').slice(0, 80),
    date: /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : '',
    teacher: (q.get('tc') ?? '').slice(0, 60),
    uchitel: oneOf(q.get('a'), ['otvety', 'kratko', 'polno'] as const, 'kratko'),
    theme: oneOf(q.get('t'), ['color', 'print'] as const, 'color'),
    seed: (q.get('seed') ?? '').replace(/[^A-Za-z0-9]/g, '').slice(0, 12),
    zameny,
    urok: 0,
    qr: q.get('qr') === '1',
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
