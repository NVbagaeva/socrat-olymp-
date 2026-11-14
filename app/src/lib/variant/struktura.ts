/**
 * Варианты и структура экзамена (content/struktura.js).
 *
 * В данных варианта задача помнит номер хранения своего раздела
 * (VariantTask.egeNumber, Chast2Zadacha.no): по нему подключается
 * сборщик задач (adapters/zNN), считается зерно, собирается код
 * варианта, пишутся ключи сохранённых работ и строки базы. Эти номера
 * не меняются никогда.
 *
 * Здесь — всё, что от действующей структуры зависит:
 *   — из каких заданий собирается вариант (первая часть экзамена);
 *   — под каким номером задача показана человеку;
 *   — какой вариант считается полной первой частью.
 * Баллы частей и шкала — content/variantOnline/bally.ts и shkala.ts.
 *
 * В структуре из 20 заданий номер на экране равен номеру хранения, и
 * вариант собирается из всех тринадцати заданий — как было всегда.
 */

import { chastRazdela, estRazdel, nomerEge, vEkzamene, zadaniyaEge } from '@/content/struktura';
import { EGE_NUMBERS, type EgeNo } from './types';

const estSborshchik = (n: number): n is EgeNo => (EGE_NUMBERS as readonly number[]).includes(n);

/** Первая часть экзамена: номера хранения разделов по порядку номеров ЕГЭ. */
export const CHAST1: readonly number[] = zadaniyaEge()
  .filter((z) => z.chast === 1)
  .map((z) => z.hranenie);

/**
 * Задания, из которых собирается вариант: разделы первой части, у
 * которых есть сборщик задач. По порядку номеров ЕГЭ — он же порядок
 * номеров хранения.
 */
export const VARIANT_NUMBERS: readonly EgeNo[] = CHAST1.filter(estSborshchik);

/** Разделы первой части без сборщика задач: плитка «скоро». */
export const VARIANT_SKORO: readonly number[] = CHAST1.filter((n) => !estSborshchik(n));

/**
 * Номер задания ЕГЭ у задачи с кратким ответом. null — раздела задачи
 * нет в первой части действующей структуры (вариант собран по прежней
 * структуре, а раздел с тех пор скрыт или ушёл во вторую часть).
 */
export function nomerChasti1(hranenie: number): number | null {
  if (!estRazdel(hranenie) || !vEkzamene(hranenie) || chastRazdela(hranenie) !== 1) {
    return null;
  }
  return nomerEge(hranenie);
}

/** Номер задания ЕГЭ у задачи с развёрнутым ответом; null — раздела нет во второй части. */
export function nomerChasti2(hranenie: number): number | null {
  if (!estRazdel(hranenie) || !vEkzamene(hranenie) || chastRazdela(hranenie) !== 2) {
    return null;
  }
  return nomerEge(hranenie);
}

/** Знак вместо номера у задачи, раздела которой в этой части экзамена нет. */
export const BEZ_NOMERA = '—';

/** Номер задачи первой части для показа: «7» или «—». */
export function podpis1(hranenie: number): string {
  return String(nomerChasti1(hranenie) ?? BEZ_NOMERA);
}

/** Номер задачи второй части для показа: «14» или «—». */
export function podpis2(hranenie: number): string {
  return String(nomerChasti2(hranenie) ?? BEZ_NOMERA);
}

/**
 * Вариант покрывает всю первую часть экзамена: в нём есть задача
 * каждого её раздела. Только по такому варианту считается тестовый балл.
 */
export function vsyaChast1(numbers: readonly number[]): boolean {
  return numbers.length === CHAST1.length && CHAST1.every((n) => numbers.includes(n));
}
