/**
 * Ответы задания №8 в браузере: только в закрытом виде.
 *
 * Устройство то же, что у заданий №3 и №4 (lib/zadanie3/secret.ts):
 * вниз уходит не число, а его отпечаток; введённое нормализуется и
 * хешируется тем же кодом. Соль своя — таблицу отпечатков одного
 * раздела нельзя приложить к другому.
 *
 * Это не защита от человека с отладчиком, а защита от подглядывания
 * в разметку, поиск по странице и исходник бандла.
 */

import { parseAnswer } from '../answer';

/** Соль отпечатка. Меняется вместе с форматом. */
const SALT = 'z8:v1:';

/** Число в единственную запись: «0,5», «0.5», «1/2» и «0,50» — одно. */
export function canonical(value: string): string | null {
  const parsed = parseAnswer(value);
  if (parsed === null) {
    return null;
  }
  return String(Math.round(parsed * 1e9) / 1e9);
}

/** Отпечаток строки: два независимых прохода FNV-1a, 16 hex-цифр. */
export function fingerprint(value: string): string {
  const text = SALT + value;
  let a = 0x811c9dc5;
  let b = 0x01000193;
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i);
    a = Math.imul(a ^ code, 0x01000193) >>> 0;
    b = Math.imul(b ^ code, 0x85ebca6b) >>> 0;
    b = (b ^ (b >>> 13)) >>> 0;
  }
  return a.toString(16).padStart(8, '0') + b.toString(16).padStart(8, '0');
}

/** Отпечаток верного числового ответа. */
export function sealAnswer(answer: number): string {
  return fingerprint(String(Math.round(answer * 1e9) / 1e9));
}

/** Отпечаток верного варианта выбора: у подготовительных задач на знак. */
export function sealChoice(choice: string): string {
  return fingerprint('choice:' + choice);
}

/** Сходится ли введённое число с отпечатком. */
export function answerMatches(input: string, sealed: string): boolean {
  const value = canonical(input);
  return value !== null && fingerprint(value) === sealed;
}

/** Сходится ли выбранный вариант с отпечатком. */
export function choiceMatches(choice: string, sealed: string): boolean {
  return sealChoice(choice) === sealed;
}

/* ── Закрытый разбор ─────────────────────────────────────────────
   Разбор содержит ответ, поэтому открытым текстом он в бандл не
   идёт: строка шифруется потоком от того же отпечатка и раскрывается
   только по просьбе ученика. */

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

function fromBase64(text: string): Uint8Array {
  const clean = text.replace(/=+$/, '');
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

/** Закрыть разбор: вызывается на сборке или в момент генерации. */
export function sealText(text: string, seed: string): string {
  const raw = new TextEncoder().encode(text);
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
