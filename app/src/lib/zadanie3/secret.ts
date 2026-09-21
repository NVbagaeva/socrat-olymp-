/**
 * Ответы задания №3 в браузере: только в закрытом виде.
 *
 * Устройство общее для разделов (lib/secret.ts): вниз уходит не
 * число, а его отпечаток с солью раздела и ключом задачи; разбор
 * закрыт этим же отпечатком. Здесь — соль раздела, ключ задачи и
 * запись числа в единственный вид.
 */

import { parseAnswer } from '../answer';
import { fingerprint as otpechatok, roundNumber, sealValue } from '../secret';

export { openText, sealText } from '../secret';

/** Соль раздела. Меняется вместе с форматом. */
const SALT = 'z3:v2:';

/** Ключ задачи: прототип и номер варианта. Он же стоит в странице. */
export function klyuchZadachi(id: string, n: number): string {
  return `${id}#${n}`;
}

/**
 * Число в единственную запись. «1,5», «1.5», «3/2» и «1,50» дают
 * одну и ту же строку, поэтому и отпечаток у них один.
 */
export function canonical(value: string): string | null {
  const num = parseAnswer(stripPi(value));
  if (num === null) {
    return null;
  }
  /* Девять знаков после запятой: столько же округления, сколько
     в проверке банка, — «2.0000000001» и «2» это одно число. */
  return roundNumber(num);
}

/**
 * Хвостовая π у ответа «делённый на π»: в условии просят число без
 * неё, но написать «4,5π» — понятная ошибка формы, а не ответа.
 */
function stripPi(value: string): string {
  return value.trim().replace(/\s*(?:π|pi|Pi|PI|пи)\s*$/u, '');
}

/** Отпечаток строки с солью раздела. */
export function fingerprint(value: string): string {
  return otpechatok(SALT, value);
}

/** Отпечаток верного ответа задачи: считается на сборке. */
export function sealAnswer(answer: number, klyuch: string): string {
  return sealValue(SALT, klyuch, roundNumber(answer));
}

/** Сходится ли введённое с отпечатком задачи. */
export function answerMatches(input: string, sealed: string, klyuch: string): boolean {
  const value = canonical(input);
  return value !== null && sealValue(SALT, klyuch, value) === sealed;
}
