/**
 * Ответ ученика в задании №6: принимается любая верная запись числа —
 * 0,75 = 0.75 = 3/4 = 75/100 = +0,750; пробелы и типографский минус не
 * мешают. Разбор записи — общий с №7 (chisloIzVvoda), своя только соль
 * отпечатка.
 */

import { createOtpechatok } from '../otpechatok';
import { chisloIzVvoda } from '../zadanie7/otvet';

export { chisloIzVvoda };

const sekret = createOtpechatok('z6:v1:');

/** Совпадает ли ответ ученика с отпечатком (любая верная запись числа). */
export function answerMatches6(vvod: string, seal: string): boolean {
  const x = chisloIzVvoda(vvod);
  if (x === null) {
    return false;
  }
  /* Округление до 9 знаков: 3/10 даёт 0,30000000000000004. */
  const okr = Math.round(x * 1e9) / 1e9;
  return sekret.answerMatches(String(okr), seal);
}
