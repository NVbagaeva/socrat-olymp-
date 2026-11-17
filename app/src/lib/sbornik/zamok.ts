/**
 * Закрытые ответы сборника — то же устройство, что у заданий ЕГЭ
 * (lib/otpechatok.ts), своя соль.
 *
 * Сайт статический, проверка — в браузере. Поэтому верные значения
 * уходят туда не числами, а отпечатками: значение округляется до 8
 * значащих цифр (kanon) и хешируется; ответ ученика вычисляется в тех
 * же точках, округляется так же и сравнивается по отпечатку. Решение,
 * запись ответа и промежутки ответа по случаям зашифрованы и
 * открываются, когда ученик сам просит решение или ответил верно.
 *
 * Это защита от подглядывания в файлы данных и поиск по странице, а не
 * от человека с отладчиком.
 */

import { createOtpechatok } from '@/lib/otpechatok';

const Z = createOtpechatok('sbornik-v1');

/** Значащих цифр в отпечатке значения. */
const ZNAKOV = 8;

/**
 * Каноническая запись числа: 8 значащих цифр, «мантисса e порядок»:
 * 2,5 → «25000000e0», −0,00731 → «-73100000e-3». Ноль — «0».
 * Бесконечность и NaN — null.
 */
export function kanon(v: number): string | null {
  if (!Number.isFinite(v)) return null;
  if (Math.abs(v) < 1e-12) return '0';
  let e = Math.floor(Math.log10(Math.abs(v)));
  let m = Math.round(v / 10 ** (e - (ZNAKOV - 1)));
  if (Math.abs(m) >= 10 ** ZNAKOV) {
    e += 1;
    m = Math.round(v / 10 ** (e - (ZNAKOV - 1)));
  }
  return `${m}e${e}`;
}

/**
 * Отпечаток пригоден, только если от погрешности счёта он не зависит:
 * значение не стоит на границе округления. Такие точки сборка
 * отбрасывает (bank.ts).
 */
export function ustoychivo(v: number): boolean {
  const a = kanon(v * (1 + 1e-10));
  const b = kanon(v * (1 - 1e-10));
  return a !== null && a === b && a === kanon(v);
}

export function otpechatokZnacheniya(v: number): string | null {
  const k = kanon(v);
  return k === null ? null : Z.fingerprint(`z:${k}`);
}

export function sovpadaetZnachenie(v: number, otpechatok: string): boolean {
  return otpechatokZnacheniya(v) === otpechatok;
}

/** Отпечаток строки (объединение промежутков ответа). */
export function otpechatokStroki(s: string): string {
  return Z.fingerprint(`s:${s}`);
}

export function zakryt(text: string, klyuch: string): string {
  return Z.sealText(text, klyuch);
}

export function otkryt(sealed: string, klyuch: string): string {
  return Z.openText(sealed, klyuch);
}
