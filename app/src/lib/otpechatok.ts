/**
 * Фабрика отпечатков ответов: одно устройство на все задания.
 *
 * Сайт собирается статически, сервера нет, поэтому верный ответ в
 * браузер уходит не числом, а отпечатком: введённое нормализуется и
 * хешируется тем же кодом, разбор шифруется потоком от того же
 * отпечатка и раскрывается только по просьбе ученика. Задания №3,
 * №4–5 и №8 держат по своей копии этого кода (lib/<задание>/secret.ts) с
 * собственной солью; здесь то же самое, но солью-параметром — чтобы
 * новое задание получало свой набор функций одной строкой, а не
 * ещё одной копией.
 *
 * Это защита от подглядывания в разметку, поиска по странице и
 * исходника бандла, а не от человека с отладчиком.
 */

import { parseAnswer } from './answer';

export interface Otpechatok {
  canonical(value: string): string | null;
  fingerprint(value: string): string;
  sealAnswer(answer: number): string;
  sealChoice(choice: string): string;
  answerMatches(input: string, sealed: string): boolean;
  choiceMatches(choice: string, sealed: string): boolean;
  sealText(text: string, seed: string): string;
  openText(sealed: string, seed: string): string;
}

/* ── Закрытый текст: поток от seed, base64 без зависимостей ────── */

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

/** Набор функций отпечатка под свою соль: меняется вместе с форматом. */
export function createOtpechatok(salt: string): Otpechatok {
  function canonical(value: string): string | null {
    const parsed = parseAnswer(value);
    if (parsed === null) {
      return null;
    }
    return String(Math.round(parsed * 1e9) / 1e9);
  }

  /** Два независимых прохода FNV-1a, 16 hex-цифр. */
  function fingerprint(value: string): string {
    const text = salt + value;
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

  function sealText(text: string, seed: string): string {
    const raw = new TextEncoder().encode(text);
    const key = keystream(salt + seed, raw.length);
    const out = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i += 1) {
      out[i] = (raw[i] as number) ^ (key[i] as number);
    }
    return toBase64(out);
  }

  function openText(sealed: string, seed: string): string {
    const raw = fromBase64(sealed);
    const key = keystream(salt + seed, raw.length);
    const out = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i += 1) {
      out[i] = (raw[i] as number) ^ (key[i] as number);
    }
    return new TextDecoder().decode(out);
  }

  return {
    canonical,
    fingerprint,
    sealAnswer: (answer) => fingerprint(String(Math.round(answer * 1e9) / 1e9)),
    sealChoice: (choice) => fingerprint('choice:' + choice),
    answerMatches(input, sealed) {
      const value = canonical(input);
      return value !== null && fingerprint(value) === sealed;
    },
    choiceMatches: (choice, sealed) => fingerprint('choice:' + choice) === sealed,
    sealText,
    openText,
  };
}
