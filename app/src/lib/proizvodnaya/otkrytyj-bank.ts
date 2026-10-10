/**
 * Открытый банк задания №9: задачи, которые добавил человек.
 *
 * Файл создаётся скриптом scripts/build-bank-9-open.mjs
 * (pnpm build:bank-9-open) из content-source/proizvodnaya/
 * otkrytyj-bank.json и правится только им. Ответа числом здесь нет:
 * отпечаток и закрытый разбор, как у сгенерированных задач.
 */

export interface OpenBankTask {
  id: string;
  prototype: string;
  /** Условие: текст с формулами в $…$. */
  uslovie: string;
  /** Адрес картинки в public, если она есть. */
  kartinka: string | null;
  /** Отпечаток верного ответа. */
  seal: string;
  /** Разбор: JSON-массив строк, закрытый отпечатком; нет разбора — null. */
  razbor: string | null;
  istochnik: 'otkrytyj-bank';
}

export const OPEN_BANK: OpenBankTask[] = [];
