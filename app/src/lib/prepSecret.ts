/**
 * Ответы опорных задач задания №12 в браузере: только в закрытом виде.
 *
 * Устройство общее для разделов (lib/secret.ts): вниз уходит не
 * ответ, а его отпечаток с солью раздела и ключом задачи; разбор и
 * пояснения к неверным вариантам закрыты этим же отпечатком.
 *
 * Ответ у задачи бывает числом — тогда отпечаток берётся с числа в
 * единственной записи, как у №3, №4 и №5, — или номером верного
 * варианта у задач с выбором: тогда с номера, и сверяется нажатая
 * кнопка.
 *
 * Модуль без зависимостей от движка graph/: его читает браузер.
 */

import { parseAnswer } from './answer';
import { roundNumber, sealValue } from './secret';

export { openText, sealText } from './secret';

/** Соль раздела. Меняется вместе с форматом. */
const SALT = 'g12:v1:';

/** Число в единственную запись: «1,5», «1.5», «3/2» дают одну строку. */
function canonical(value: string): string | null {
  const parsed = parseAnswer(value);
  return parsed === null ? null : roundNumber(parsed);
}

/** Отпечаток числового ответа задачи: считается на сборке. */
export function sealAnswer(answer: string, klyuch: string): string {
  const value = canonical(answer);
  if (value === null) {
    throw new Error(`Ответ задачи ${klyuch} не число: ${answer}`);
  }
  return sealValue(SALT, klyuch, value);
}

/** Сходится ли введённое число с отпечатком задачи. */
export function answerMatches(input: string, sealed: string, klyuch: string): boolean {
  const value = canonical(input);
  return value !== null && sealValue(SALT, klyuch, value) === sealed;
}

/** Отпечаток номера верного варианта: считается на сборке. */
export function sealChoice(choice: string, klyuch: string): string {
  return sealValue(SALT, klyuch, `choice:${choice}`);
}

/** Сходится ли нажатый вариант с отпечатком задачи. */
export function choiceMatches(choice: string, sealed: string, klyuch: string): boolean {
  return sealValue(SALT, klyuch, `choice:${choice}`) === sealed;
}
