/**
 * Картинки к задачам №11: подтип → готовая картинка (адрес в public,
 * подпись, размер). Картинки — только там, где без рисунка не понять
 * (docs/redesign-plan.md, решение 4): место под картинку в примере типа
 * и в тренажёре предусмотрено, но, пока записи здесь нет, ничего не
 * выводится — ни рамки, ни заглушки. Картинка, когда появится, ставится
 * как есть: без обрезки и пережатия.
 */

export interface Kartinka11 {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export const KARTINKI_11: Readonly<Record<string, Kartinka11>> = {
  /* Обгон: путь «мимо» — сумма длин поездов (смещение относительно товарного). */
  'PT-03': {
    src: '/images/zadanie11/pt-03-obgon.svg',
    alt: 'Начало и конец обгона: пассажирский поезд длины x смещается относительно товарного на x плюс длина товарного',
    width: 640,
    height: 330,
  },
};

export function kartinka11(podtip: string): Kartinka11 | undefined {
  return KARTINKI_11[podtip];
}
