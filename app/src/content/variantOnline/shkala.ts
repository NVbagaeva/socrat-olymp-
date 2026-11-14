/**
 * Шкала перевода первичных баллов в тестовые — предварительная.
 *
 * Сама таблица записана в структуре экзамена (content/struktura.js,
 * поле shkala): официальной шкалы 2027 года ещё нет, поэтому там —
 * последняя официальная, ЕГЭ-2026, с пометкой «предварительная».
 * Максимум — 32 первичных балла. Выйдет шкала 2027 года — заменить
 * таблицу в структуре.
 *
 * Вариант только из первой части берёт начало шкалы: строку
 * «первичный балл → тестовый».
 *
 * TESTOVYJ[k] — тестовый балл за k первичных.
 */

import { STRUKTURA, maxPervichnyy } from '@/content/struktura';

export const SHKALA_ISTOCHNIK: string = STRUKTURA.shkala.istochnik;

export const TESTOVYJ: readonly number[] = STRUKTURA.shkala.tablitsa;

/**
 * Вариант из двух частей (13 + 7 заданий, максимум 33 первичных балла):
 * официальной шкалы 2027 года ещё нет, поэтому шкала выше (32 балла)
 * равномерно растягивается на 0…33 — тестовый балл за k первичных равен
 * её значению в точке k·32/33 (линейно между соседними, с округлением).
 * На сайте рядом — пометка «ориентировочно».
 */
export function rastyanut(shkala: readonly number[], max: number): number[] {
  const n = shkala.length - 1;
  return Array.from({ length: max + 1 }, (_, k) => {
    const t = (k * n) / max;
    const i = Math.floor(t);
    const a = shkala[i] ?? 100;
    const b = shkala[Math.min(i + 1, n)] ?? 100;
    return Math.round(a + (b - a) * (t - i));
  });
}

export const TESTOVYJ_33: readonly number[] = rastyanut(TESTOVYJ, 33);

/**
 * Шкала всей работы — обе части — по действующей структуре экзамена:
 * TESTOVYJ_RABOTY[k] — тестовый балл за k первичных из
 * maxPervichnyy(). Первичных столько же, сколько в таблице (32), —
 * таблица берётся как есть; иначе растягивается.
 */
export const TESTOVYJ_RABOTY: readonly number[] =
  maxPervichnyy() === TESTOVYJ.length - 1 ? TESTOVYJ : rastyanut(TESTOVYJ, maxPervichnyy());
