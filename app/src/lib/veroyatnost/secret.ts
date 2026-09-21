/**
 * Ответы заданий №4 и №5 в браузере: только в закрытом виде.
 *
 * Устройство общее для разделов (lib/secret.ts): вниз уходит не
 * число, а его отпечаток с солью раздела и ключом задачи; разбор
 * закрыт этим же отпечатком. Здесь — соль раздела, ключ задачи,
 * запись числа в единственный вид и отпечаток метода для режима
 * «Узнай метод».
 */

import { parseAnswer } from '../answer';
import { fingerprint as otpechatok, roundNumber, sealValue } from '../secret';

export { openText, sealText } from '../secret';

/** Соль раздела. Меняется вместе с форматом. */
const SALT = 'tv:v2:';

/**
 * Ключ задачи: прототип и номер варианта; у задачи конспекта
 * вариант один. Он же стоит в странице открыто.
 */
export function klyuchZadachi(id: string, n = 1): string {
  return `${id}#${n}`;
}

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
  return roundNumber(parsed);
}

/** Отпечаток строки с солью раздела. */
export function fingerprint(value: string): string {
  return otpechatok(SALT, value);
}

/**
 * Отпечаток метода для режима «Узнай метод»: с ним сверяется нажатая
 * кнопка, им же закрыты признаки в условии. Считается и на сборке, и в
 * браузере — поэтому живёт здесь, а не рядом с банком.
 */
export function sealMetod(metod: string): string {
  return fingerprint(`metod:${metod}`);
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
