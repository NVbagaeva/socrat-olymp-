/**
 * Код партии вариантов: настройки состава + seed + замены одной строкой.
 *
 *   K7M2-1Z0GH-4F              seed · состав · версия генератора
 *   K7M2-1Z0GH-4F.S93.ZB01     + подтипы (S…) и замены (Z…)
 *
 * Алфавит — Crockford base32, как у кодов комплектов (lib/komplekt.ts):
 * код читают с бумаги. Вставили код — получили ту же партию. Шапка
 * работы (тип, дата, учитель) в код не входит: на задачи она не влияет.
 *
 * Состав (25 бит, 5 знаков): задания 1–13 маской, источник, звёзды
 * маской, число вариантов − 1, параллельность.
 * Подтипы: для каждого задания с выбранными подтипами — знак номера
 * задания и маска подтипов фиксированной длины (по числу подтипов
 * раздела в lib/variant/sections.ts).
 * Замены: тройки знаков «вариант − 1, задание, сколько раз».
 * Место для решения (P…): настройка листа ученика (lib/sheet/space.js,
 * encodeSpace) — на задачи не влияет, но хранится с кодом, чтобы лист
 * воспроизводился тем же.
 */

import { EGE_NUMBERS, MAX_VARIANTS, type EgeNo, type Stars, type VariantConfig } from './types';

const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const SOURCES = ['mix', 'fipi', 'own'] as const;

function enc(value: number, len: number): string {
  let out = '';
  for (let i = len - 1; i >= 0; i -= 1) {
    out += ALPHABET[Math.floor(value / 32 ** i) % 32];
  }
  return out;
}

function dec(text: string): number | null {
  let value = 0;
  for (const ch of text) {
    const d = ALPHABET.indexOf(ch);
    if (d < 0) return null;
    value = value * 32 + d;
  }
  return value;
}

/** Новый seed партии: четыре знака. */
export function newSeed(random: () => number = Math.random): string {
  return enc(Math.floor(random() * 32 ** 4), 4);
}

export interface Decoded {
  seed: string;
  config: VariantConfig;
  zameny: Record<string, number>;
  version: string;
  /** Место для решения: знаки encodeSpace; '' — без места. */
  space?: string;
}

/** Код с настройкой места для решения: хвост .P… (пусто — без хвоста). */
export function codeWithSpace(code: string, token: string): string {
  const base = baseCode(code);
  return token === '' ? base : `${base}.P${token}`;
}

/** Код без хвоста места для решения: так его знает набор (set.code). */
export function baseCode(code: string): string {
  return code
    .split('.')
    .filter((part, i) => i === 0 || !part.startsWith('P'))
    .join('.');
}

/** Хвост места для решения из кода: знаки encodeSpace или ''. */
export function spaceOfCode(code: string): string {
  const tail = normalizeCode(code)
    .split('.')
    .slice(1)
    .find((part) => part.startsWith('P'));
  return tail === undefined ? '' : tail.slice(1);
}

export function encodeCode(
  d: Decoded,
  subtypeIds: Readonly<Record<EgeNo, readonly string[]>>,
): string {
  const c = d.config;
  let mask = 0;
  for (const n of c.tasks) mask |= 1 << (n - 1);
  const stars = c.stars.reduce((m, s) => m | (1 << (s - 1)), 0);
  const src = Math.max(0, SOURCES.indexOf(c.source));
  /* Порядок полей — от младших битов. */
  const packed =
    mask +
    2 ** 13 * src +
    2 ** 15 * stars +
    2 ** 18 * (Math.min(MAX_VARIANTS, Math.max(1, c.count)) - 1) +
    2 ** 22 * (c.parallel ? 1 : 0);
  let code = `${d.seed}-${enc(packed, 5)}-${d.version}`;
  const sub = EGE_NUMBERS.flatMap((n) => {
    const chosen = c.subtypes[n];
    const ids = subtypeIds[n];
    if (chosen === undefined || ids.length === 0) return [];
    const bits = ids.reduce((m, id, i) => (chosen.includes(id) ? m + 2 ** i : m), 0);
    if (bits === 2 ** ids.length - 1 || bits === 0) return [];
    return [enc(n, 1) + enc(bits, Math.ceil(ids.length / 5))];
  }).join('');
  if (sub !== '') code += `.S${sub}`;
  const zam = Object.entries(d.zameny)
    .map(([key, k]) => {
      const [v = 0, n = 0] = key.split('.').map(Number);
      return { v, n, k };
    })
    .filter((z) => z.v >= 1 && z.v <= MAX_VARIANTS && z.n >= 1 && z.n <= 13 && z.k > 0)
    .sort((a, b) => a.v - b.v || a.n - b.n)
    .map((z) => enc(z.v - 1, 1) + enc(z.n, 1) + enc(Math.min(31, z.k), 1))
    .join('');
  if (zam !== '') code += `.Z${zam}`;
  return code;
}

/** Код с бумаги: регистр, пробелы и похожие буквы прощаются. */
export function normalizeCode(text: string): string {
  return text
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/[ОO]/g, '0')
    .replace(/[IL]/g, '1')
    .replace(/[–—]/g, '-');
}

export function decodeCode(
  raw: string,
  subtypeIds: Readonly<Record<EgeNo, readonly string[]>>,
): Decoded | null {
  const text = normalizeCode(raw);
  const [main = '', ...tails] = text.split('.');
  const m = /^([0-9A-Z]{4})-([0-9A-Z]{5})-([0-9A-Z]{2})$/.exec(main);
  if (m === null) return null;
  const [, seed = '', cfg = '', version = ''] = m;
  const packed = dec(cfg);
  if (packed === null) return null;
  const mask = packed % 2 ** 13;
  const src = Math.floor(packed / 2 ** 13) % 4;
  const starsMask = Math.floor(packed / 2 ** 15) % 8;
  const count = (Math.floor(packed / 2 ** 18) % 16) + 1;
  const parallel = Math.floor(packed / 2 ** 22) % 2 === 1;
  const tasks = EGE_NUMBERS.filter((n) => (mask & (1 << (n - 1))) !== 0);
  if (tasks.length === 0 || count > MAX_VARIANTS || src > 2) return null;
  const stars = ([1, 2, 3] as Stars[]).filter((s) => (starsMask & (1 << (s - 1))) !== 0);
  const subtypes: VariantConfig['subtypes'] = {};
  const zameny: Record<string, number> = {};
  let space = '';
  for (const tail of tails) {
    if (tail.startsWith('P')) {
      space = tail.slice(1);
    } else if (tail.startsWith('S')) {
      let rest = tail.slice(1);
      while (rest.length > 0) {
        const n = dec(rest.slice(0, 1));
        if (n === null || n < 1 || n > 13) return null;
        const ids = subtypeIds[n as EgeNo];
        const len = Math.ceil(ids.length / 5);
        const bits = dec(rest.slice(1, 1 + len));
        if (bits === null || len === 0) return null;
        subtypes[n as EgeNo] = ids.filter((_, i) => Math.floor(bits / 2 ** i) % 2 === 1);
        rest = rest.slice(1 + len);
      }
    } else if (tail.startsWith('Z')) {
      const body = tail.slice(1);
      if (body.length % 3 !== 0) return null;
      for (let i = 0; i < body.length; i += 3) {
        const v = dec(body.slice(i, i + 1));
        const n = dec(body.slice(i + 1, i + 2));
        const k = dec(body.slice(i + 2, i + 3));
        if (v === null || n === null || k === null) return null;
        zameny[`${v + 1}.${n}`] = k;
      }
    } else {
      return null;
    }
  }
  return {
    seed,
    version,
    zameny,
    config: { tasks, subtypes, source: SOURCES[src] ?? 'mix', stars, count, parallel },
    space,
  };
}
