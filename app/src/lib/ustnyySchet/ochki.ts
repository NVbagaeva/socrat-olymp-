/**
 * Очки и сравнение результатов — одни формулы для итогов, личных
 * рекордов и рейтинга. Сервер считает то же самое на SQL; проверка
 * scripts/check-ustnyy-schet.mjs сверяет формулы на таблице случаев.
 *
 *   «На время»: выше тот, у кого больше верных; при равенстве — у кого
 *   точность больше; при равной точности — кто показал результат раньше.
 *   «Серия»: итоговое время = чистое время + 5 с за каждую ошибку,
 *   меньше — лучше; при равенстве — раньше.
 *   В рейтинг (и в рекорд формата) — только при точности от 80 %.
 *
 * Точность сравнивается без деления: a/b против c/d — a·d против c·b.
 */

export const SHTRAF_MS = 5000;
/** Порог точности для рейтинга: 80 % = 4/5. */
export const POROG_CHISLITEL = 4;
export const POROG_ZNAMENATEL = 5;

export interface Rezultat {
  verno: number;
  vsego: number;
  /** Чистое время, мс. */
  ms: number;
  /** Когда показан (мс эпохи) — для равенства. */
  at: number;
}

export function oshibki(r: Rezultat): number {
  return r.vsego - r.verno;
}

/** Точность в процентах, округлённая вниз (для показа). */
export function tochnostProc(r: { verno: number; vsego: number }): number {
  return r.vsego === 0 ? 0 : Math.floor((100 * r.verno) / r.vsego);
}

/** Проходит ли результат порог точности (≥ 80 %). */
export function prohodit(r: { verno: number; vsego: number }): boolean {
  return r.vsego > 0 && r.verno * POROG_ZNAMENATEL >= r.vsego * POROG_CHISLITEL;
}

/** Итоговое время серии: чистое время + 5 с за ошибку. */
export function itogMs(r: Rezultat): number {
  return r.ms + SHTRAF_MS * oshibki(r);
}

/** Сравнение точностей: >0 — у a выше. */
function tochnostCmp(a: Rezultat, b: Rezultat): number {
  return a.verno * b.vsego - b.verno * a.vsego;
}

/**
 * Сравнение двух результатов: отрицательное — a выше в таблице.
 * tip — формат «на время» или «серия».
 */
export function sravnit(tip: 'vremya' | 'seriya', a: Rezultat, b: Rezultat): number {
  if (tip === 'vremya') {
    if (a.verno !== b.verno) return b.verno - a.verno;
    const t = tochnostCmp(a, b);
    if (t !== 0) return -Math.sign(t);
    return a.at - b.at;
  }
  const d = itogMs(a) - itogMs(b);
  if (d !== 0) return d;
  return a.at - b.at;
}

/** Лучше ли новый результат прежнего рекорда (рекорд — только с точностью от 80 %). */
export function novyyRekord(
  tip: 'vremya' | 'seriya',
  novyy: Rezultat,
  prezhniy: Rezultat | null,
): boolean {
  if (!prohodit(novyy)) return false;
  return prezhniy === null || sravnit(tip, novyy, prezhniy) < 0;
}
