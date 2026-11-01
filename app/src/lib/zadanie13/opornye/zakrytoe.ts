/**
 * Закрытая часть задач «Опорных задач» №13 — файлами сборки.
 *
 * Разбор и пошаговые подсказки задачи банка весят по 50–130 КБ
 * (готовая вёрстка таблиц и формул, закрытая отпечатком ответа), а в
 * блоке десять задач: раньше страница блока весила до 3 МБ, хотя
 * ученик открывает решение одной-двух задач. Теперь в странице —
 * условие, таблица и отпечатки, а разбор и подсказки лежат файлом
 * /zadaniya/13/dannye/opornye/<блок>/<номер>.json и загружаются по
 * кнопке «Подсказка» или «Показать решение». Содержимое — те же две
 * закрытые строки, что раньше были в задаче, знак в знак.
 *
 * Модуль без Node: его импортируют и страница, и экран задачи.
 */

import type { Zadacha13Sealed } from './seal';

/** Закрытая часть задачи: то, что уехало в файл. */
export type Zakrytoe13 = Pick<Zadacha13Sealed, 'podskazki' | 'razbor'>;

/** Задача блока на странице: закрытая часть — адресом файла. */
export type Zadacha13Bloka = Zadacha13Sealed & {
  no: number;
  /** Адрес файла с разбором и подсказками; нет — они в самой задаче («Ещё вариант»). */
  zakryto?: string;
};

/** Адрес файла без версии — так его отдаёт маршрут сборки. */
export function putZakrytogo13(blok: string, no: number): string {
  return `/zadaniya/13/dannye/opornye/${blok}/${no}.json`;
}

const kesh = new Map<string, Promise<Zakrytoe13>>();

/**
 * Разбор и подсказки задачи: свои — сразу, банка — из файла (один раз
 * за визит; неудачный запрос из памяти убирается).
 */
export function zakrytoe13(task: Zadacha13Sealed & { zakryto?: string }): Promise<Zakrytoe13> {
  const adres = task.zakryto;
  if (adres === undefined) {
    return Promise.resolve({ podskazki: task.podskazki, razbor: task.razbor });
  }
  let zapros = kesh.get(adres);
  if (zapros === undefined) {
    zapros = fetch(adres).then((r) => {
      if (!r.ok) {
        throw new Error(`${adres}: ${r.status}`);
      }
      return r.json() as Promise<Zakrytoe13>;
    });
    zapros.catch(() => kesh.delete(adres));
    kesh.set(adres, zapros);
  }
  return zapros;
}
