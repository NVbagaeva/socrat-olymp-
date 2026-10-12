/**
 * Ответ ученика в задании №7: принимается любая верная запись числа.
 *
 *   1,4 = 1.4 = 7/5 = −(−1,4) = +1,4 = 1,40; пробелы и типографский
 *   минус не мешают. Смешанное «1 2/5» — тоже 1,4.
 *
 * Тригонометрия: ответ — число, π в ответ не пишут (x = 0,5, а не π/6).
 * Если в записи есть π, это не «неверно», а повод переспросить — см.
 * estPi().
 */

import { createOtpechatok } from '../otpechatok';

const sekret = createOtpechatok('z7:v1:');

/** Есть ли в записи π (символ или pi/пи). */
export function estPi(vvod: string): boolean {
  return /π|\\pi|\bpi\b|пи/i.test(vvod);
}

/**
 * Запись ученика → число: снимает внешние «−( … )» и «+( … )», читает
 * обыкновенную дробь и смешанное число. Не число — null.
 */
export function chisloIzVvoda(vvod: string): number | null {
  let s = vvod
    .replace(/[   ]/g, ' ')
    .replace(/[−‒–—]/g, '-')
    .replace(/,/g, '.')
    .trim();
  let znak = 1;
  /* Внешние скобки со знаком: −(−1,4), +(1,4), (−1,4). */
  for (let i = 0; i < 5; i += 1) {
    const m = /^([+-]?)\s*\((.*)\)$/.exec(s);
    if (!m) {
      break;
    }
    if (m[1] === '-') {
      znak = -znak;
    }
    s = (m[2] ?? '').trim();
  }
  /* Ведущие знаки: «--1,4», «+1,4». */
  while (/^[+-]/.test(s)) {
    if (s[0] === '-') {
      znak = -znak;
    }
    s = s.slice(1).trim();
  }
  if (s === '') {
    return null;
  }
  /* Смешанное число: «1 2/5». */
  const smesh = /^(\d+)\s+(\d+)\/(\d+)$/.exec(s);
  if (smesh) {
    const [w, n, m] = [Number(smesh[1]), Number(smesh[2]), Number(smesh[3])];
    return m === 0 ? null : znak * (w + n / m);
  }
  const bezProbelov = s.replace(/\s+/g, '');
  const drob = /^(-?[\d.]+)\/(-?[\d.]+)$/.exec(bezProbelov);
  if (drob) {
    const top = Number(drob[1]);
    const bottom = Number(drob[2]);
    return Number.isFinite(top) && Number.isFinite(bottom) && bottom !== 0
      ? znak * (top / bottom)
      : null;
  }
  if (!/^[\d.]+(e-?\d+)?$/i.test(bezProbelov)) {
    return null;
  }
  const x = Number(bezProbelov);
  return Number.isFinite(x) ? znak * x : null;
}

/** Совпадает ли ответ ученика с отпечатком (любая верная запись числа). */
export function answerMatches7(vvod: string, seal: string): boolean {
  const x = chisloIzVvoda(vvod);
  if (x === null) {
    return false;
  }
  /* Округление до 9 знаков: 7/5 даёт 1,4000000000000001. */
  const okr = Math.round(x * 1e9) / 1e9;
  return sekret.answerMatches(String(okr), seal);
}
