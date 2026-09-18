/**
 * Ответы заданий №4 и №5 в браузере: только в закрытом виде.
 *
 * Правило проекта: верный ответ не попадает ни в разметку, ни в
 * бандл открыто. Вниз уходит не число, а его отпечаток: ученик
 * вводит ответ, отпечаток введённого считается в браузере и
 * сравнивается с сохранённым. Разбор тоже закрыт и раскрывается,
 * только когда ученик сам его попросил.
 *
 * Это не защита от человека с отладчиком: разобрать можно всё, что
 * уехало в браузер. Это защита от случайного подглядывания — в
 * разметке, в поиске по странице, в исходнике бандла ответа нет.
 *
 * Модуль свой, а не общий с заданием №3: у разделов разная соль,
 * поэтому одинаковый ответ «0,2» в №3 и в №4 даёт разные отпечатки,
 * и таблицу отпечатков одного раздела нельзя приложить к другому.
 * Устройство то же самое — см. lib/zadanie3/secret.ts.
 */

import { parseAnswer } from '../answer';

/** Соль отпечатка. Меняется вместе с форматом. */
const SALT = 'tv:v1:';

/**
 * Число в единственную запись. «0,2», «0.2», «1/5» и «0,20» дают
 * одну и ту же строку, поэтому и отпечаток у них один.
 */
export function canonical(value: string): string | null {
  const parsed = parseAnswer(value);
  if (parsed === null) {
    return null;
  }
  /* Девять знаков после запятой: столько же округления, сколько
     в проверке банка, — «0.2000000001» и «0,2» это одно число. */
  return String(Math.round(parsed * 1e9) / 1e9);
}

/**
 * Отпечаток строки: два независимых прохода FNV-1a, шестнадцать
 * шестнадцатеричных цифр. Столкновений на банке нет — это
 * проверяется автотестом.
 */
export function fingerprint(value: string): string {
  const source = SALT + value;
  let a = 0x811c9dc5;
  let b = 0x01000193;
  for (let i = 0; i < source.length; i += 1) {
    const code = source.charCodeAt(i);
    a = Math.imul(a ^ code, 0x01000193) >>> 0;
    b = Math.imul(b ^ code, 0x85ebca6b) >>> 0;
    b = (b ^ (b >>> 13)) >>> 0;
  }
  return a.toString(16).padStart(8, '0') + b.toString(16).padStart(8, '0');
}

/** Отпечаток верного ответа: считается на сборке. */
export function sealAnswer(answer: number): string {
  return fingerprint(String(Math.round(answer * 1e9) / 1e9));
}

/** Сходится ли введённое с отпечатком. */
export function answerMatches(input: string, sealed: string): boolean {
  const value = canonical(input);
  return value !== null && fingerprint(value) === sealed;
}

/* ── Закрытый разбор ─────────────────────────────────────────────
   Шаги разбора содержат ответ, поэтому открытым текстом они в бандл
   не идут: строка шифруется потоком от того же отпечатка и
   раскрывается, только когда ученик нажал «Посмотреть решение». */

function keystream(seed: string, length: number): Uint8Array {
  const out = new Uint8Array(length);
  let state = 0;
  for (let i = 0; i < seed.length; i += 1) {
    state = (Math.imul(state ^ seed.charCodeAt(i), 0x01000193) + 0x9e3779b9) >>> 0;
  }
  for (let i = 0; i < length; i += 1) {
    state = (Math.imul(state ^ (i + 1), 0x85ebca6b) + 0x27d4eb2f) >>> 0;
    out[i] = (state >>> 24) & 0xff;
  }
  return out;
}

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function toBase64(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i] as number;
    const b = i + 1 < bytes.length ? (bytes[i + 1] as number) : 0;
    const c = i + 2 < bytes.length ? (bytes[i + 2] as number) : 0;
    const n = (a << 16) | (b << 8) | c;
    out += B64[(n >>> 18) & 63];
    out += B64[(n >>> 12) & 63];
    out += i + 1 < bytes.length ? B64[(n >>> 6) & 63] : '=';
    out += i + 2 < bytes.length ? B64[n & 63] : '=';
  }
  return out;
}

function fromBase64(source: string): Uint8Array {
  const clean = source.replace(/=+$/, '');
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const ch of clean) {
    const index = B64.indexOf(ch);
    if (index === -1) {
      continue;
    }
    buffer = (buffer << 6) | index;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }
  return Uint8Array.from(bytes);
}

/** Закрыть разбор: вызывается на сборке. */
export function sealText(source: string, seed: string): string {
  const raw = new TextEncoder().encode(source);
  const key = keystream(seed, raw.length);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    out[i] = (raw[i] as number) ^ (key[i] as number);
  }
  return toBase64(out);
}

/** Раскрыть разбор: вызывается в браузере по просьбе ученика. */
export function openText(sealed: string, seed: string): string {
  const raw = fromBase64(sealed);
  const key = keystream(seed, raw.length);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    out[i] = (raw[i] as number) ^ (key[i] as number);
  }
  return new TextDecoder().decode(out);
}
