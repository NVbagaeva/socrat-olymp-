/**
 * Общее устройство закрытых ответов и разборов.
 *
 * Правило проекта: верный ответ не попадает ни в разметку, ни в
 * бандл открыто. Вниз уходит не число, а его отпечаток: ученик
 * вводит ответ, отпечаток введённого считается в браузере и
 * сравнивается с сохранённым. Разбор тоже закрыт и раскрывается
 * только когда ученик сам его попросил.
 *
 * Это не защита от человека с отладчиком: разобрать можно всё, что
 * уехало в браузер. Это защита от случайного подглядывания — в
 * разметке, в поиске по странице, в исходнике бандла ответа нет.
 *
 * Отпечаток солится дважды: солью раздела и ключом задачи. Поэтому
 * одинаковый ответ «0,2» в двух задачах даёт разные отпечатки, и
 * таблицу отпечатков одной задачи нельзя приложить к другой, а
 * тем более к другому разделу. Ключ задачи — её идентификатор с
 * номером варианта; он и так стоит в странице открыто.
 *
 * Модуль один на сборку и на браузер, чтобы отпечаток считался
 * одинаково с обеих сторон. Раздел №8 живёт на своём экземпляре той
 * же схемы (lib/vychisleniya/secret.ts) и сюда не ходит.
 */

/** Число в единственную запись: девять знаков после запятой. */
export function roundNumber(value: number): string {
  return String(Math.round(value * 1e9) / 1e9);
}

/**
 * Отпечаток строки: два независимых прохода FNV-1a, шестнадцать
 * шестнадцатеричных цифр. Столкновений на банках нет — это
 * проверяется автотестами разделов.
 */
export function fingerprint(salt: string, value: string): string {
  const source = salt + value;
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

/**
 * Отпечаток значения задачи: соль раздела, ключ задачи, значение.
 * Ключ и значение разделены символом, которого в ключе не бывает.
 */
export function sealValue(salt: string, klyuch: string, value: string): string {
  return fingerprint(salt, `${klyuch}\u0000${value}`);
}

/* ── Закрытый текст ──────────────────────────────────────────────
   Разбор содержит ответ, поэтому открытым текстом он в бандл не
   идёт: строка шифруется потоком от отпечатка и раскрывается,
   только когда ученик нажал «Посмотреть решение». */

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

/** Закрыть текст: вызывается на сборке. */
export function sealText(source: string, seed: string): string {
  const raw = new TextEncoder().encode(source);
  const key = keystream(seed, raw.length);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    out[i] = (raw[i] as number) ^ (key[i] as number);
  }
  return toBase64(out);
}

/** Раскрыть текст: вызывается в браузере по просьбе ученика. */
export function openText(sealed: string, seed: string): string {
  const raw = fromBase64(sealed);
  const key = keystream(seed, raw.length);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    out[i] = (raw[i] as number) ^ (key[i] as number);
  }
  return new TextDecoder().decode(out);
}
