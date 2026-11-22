/**
 * Проверка ответа №12 по общему правилу записи (lib/otvet): число в
 * записи бланка сверяется с ответом движка с тем же допуском, что и
 * прежде (lib/answer.ts, sameNumber); обыкновенная дробь с верным
 * значением — подсказка о записи, попытка не тратится. У задачи с
 * выбором варианта ответ — номер варианта, сверяется точно.
 *
 * Отпечаток задачи (seal) у №12 — сам ответ движка: задача строится в
 * браузере вместе с ответом, как и в прежнем тренажёре. Вариант
 * помечен приставкой «v:».
 */

import { sameNumber } from '@/lib/answer';
import { readAnswer, type Reading } from '@/lib/otvet';

export function seal12(answer: string, vybor: boolean): string {
  return vybor ? `v:${answer}` : answer;
}

export function readOtvet12(vvod: string, seal: string): Reading {
  if (seal.startsWith('v:')) {
    const want = seal.slice(2);
    return { kind: 'answer', value: vvod, right: vvod === want, viaFraction: false };
  }
  return readAnswer(vvod, 'trenazher', (value) => sameNumber(value, seal));
}
