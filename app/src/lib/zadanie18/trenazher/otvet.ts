/**
 * Ответы тренажёра №18 в браузере — только отпечатком (lib/otpechatok.ts).
 * Соль — раздел и ключ задачи: одинаковый ответ в двух задачах даёт
 * разные отпечатки. Разбор и подсказка закрыты тем же отпечатком и
 * раскрываются по просьбе ученика.
 */

import { createOtpechatok, type Otpechatok } from '@/lib/otpechatok';

const otp = (key: string): Otpechatok => createOtpechatok(`z18:v1:${key}:`);

export const zapechatatOtvet18 = (key: string, otvet: number): string => otp(key).sealAnswer(otvet);

export const otvetVeren18 = (key: string, vvod: string, seal: string): boolean =>
  otp(key).answerMatches(vvod, seal);

export const zapechatatTekst18 = (key: string, tekst: string, seal: string): string =>
  otp(key).sealText(tekst, seal);

export const otkrytTekst18 = (key: string, tekst: string, seal: string): string =>
  otp(key).openText(tekst, seal);

/** Ключ задачи: тип и номер варианта, «vysoty-cos#2». */
export const klyuch18 = (tip: string, n: number): string => `${tip}#${n}`;

export function poKlyuchu18(key: string): { tip: string; n: number } | null {
  const m = /^([a-z0-9-]+)#(\d+)$/.exec(key);
  return m === null ? null : { tip: m[1]!, n: Number(m[2]) };
}
