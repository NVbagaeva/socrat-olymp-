/**
 * «Проверь себя» в теории: что уезжает в браузер и как сверяется ответ.
 *
 * Правило проекта то же, что у самопроверки №4/№5: верного варианта в
 * разметке нет. У экземпляра задачи лежит отпечаток верного варианта
 * (соль раздела + ключ экземпляра), нажатый вариант сверяется с ним в
 * браузере. Подсказки и разбор закрыты этим отпечатком и раскрываются,
 * когда ученик ответил или попросил разбор.
 *
 * Модуль общий для сервера и браузера (lib/secret.ts), без KaTeX.
 */

import { openText, sealText, sealValue } from '../secret';

const SALT = 'ed-prv:v1:';

/** Вариант, как он уезжает в браузер: id, готовая вёрстка, закрытый отклик. */
export interface VariantKlient {
  id: string;
  html: string;
  /** Подсказка к этой ошибке (у верного — разбор), закрыта отпечатком. */
  otklik: string;
}

export interface EkzemplyarKlient {
  klyuch: string;
  uslovie: string;
  varianty: VariantKlient[];
  /** Отпечаток верного варианта. */
  seal: string;
  /** Разбор, закрытый отпечатком. */
  razbor: string;
}

export interface ZadachaKlient {
  id: string;
  /** Первый — числа теории, дальше — «Ещё такое же». */
  ekzemplyary: EkzemplyarKlient[];
}

export function sealVarianta(klyuch: string, id: string): string {
  return sealValue(SALT, klyuch, id);
}

export function vernyVariant(e: EkzemplyarKlient, id: string): boolean {
  return sealVarianta(e.klyuch, id) === e.seal;
}

export function zakryt(html: string, e: { seal: string }, id = ''): string {
  return sealText(html, `${e.seal}${id}`);
}

export function otkryt(sealed: string, e: { seal: string }, id = ''): string {
  return openText(sealed, `${e.seal}${id}`);
}
