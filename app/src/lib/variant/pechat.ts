/**
 * Размер чертежей на листе варианта («Собрать вариант» и «Варианты
 * повышенной сложности»): рисунки крупные — клетка 7 мм (не меньше 6),
 * подписи на бумаге не меньше 10 pt.
 *
 * Движки рисуют в своих единицах (клетка — 34 единицы viewBox), поэтому
 * лист задаёт ширину рисунка по клетке, а движку — наименьший кегль в
 * его единицах (`minFont`): при клетке 7 мм это около 17 единиц.
 */

/** Клетка чертежа на листе варианта, мм. */
export const KLETKA_MM = 7;
/** Клетка движка в единицах viewBox (graph, proizvodnaya, vektory). */
export const KLETKA_EDINIC = 34;
/** Наименьший кегль подписи на бумаге, pt. */
export const MIN_PT = 10;

const MM_V_PT = 25.4 / 72;

/** Наименьший кегль в единицах движка при клетке kletkaMm. */
export function minFont(kletkaMm: number = KLETKA_MM): number {
  return Math.round(((MIN_PT * MM_V_PT) / (kletkaMm / KLETKA_EDINIC)) * 100) / 100;
}

/** Ширина рисунка на листе по ширине viewBox: клетка — kletkaMm. */
export function shirinaPoKletke(svg: string, kletkaMm: number = KLETKA_MM): number | undefined {
  const box = /viewBox="[-0-9.]+ [-0-9.]+ ([0-9.]+) /.exec(svg);
  return box === null
    ? undefined
    : Math.round((Number(box[1]) / KLETKA_EDINIC) * kletkaMm * 100) / 100;
}

/** Наибольшая ширина рисунка под условием: колонка листа с отступом номера, мм. */
export const MAX_SHIRINA_MM = 168;
/** Клетка мельче этой не печатается. */
export const MIN_KLETKA_MM = 6;

/**
 * Крупный рисунок листа: клетка 7 мм; если рисунок шире колонки, клетка
 * уменьшается, но не меньше 6 мм, и кегль пересчитывается под неё.
 * risuy(minFont) — отрисовка движком с наименьшим кеглем в его единицах.
 */
export function krupnyyRisunok(risuy: (kegl: number) => string): {
  svg: string;
  width: number;
  kletka: number;
} {
  let kletka = KLETKA_MM;
  let svg = risuy(minFont(kletka));
  let width = shirinaPoKletke(svg, kletka) ?? MAX_SHIRINA_MM;
  if (width > MAX_SHIRINA_MM) {
    kletka = Math.max(MIN_KLETKA_MM, Math.floor((MAX_SHIRINA_MM / width) * kletka * 100) / 100);
    svg = risuy(minFont(kletka));
    width = shirinaPoKletke(svg, kletka) ?? MAX_SHIRINA_MM;
  }
  return { svg, width, kletka };
}

/**
 * Ширина, при которой самая мелкая подпись рисунка печатается не мельче
 * MIN_PT: кегли подписей (font-size у <text>) и ширина viewBox — из
 * самого SVG. null — подписей с кеглем в разметке нет.
 */
export function shirinaDlyaKegla(svg: string): number | null {
  const vb = /viewBox="[-0-9.]+ [-0-9.]+ ([0-9.]+) /.exec(svg);
  if (vb === null) return null;
  let min = Infinity;
  for (const m of svg.matchAll(/<text\b[^>]*?\sfont-size="([0-9.]+)"/g)) {
    min = Math.min(min, Number(m[1]));
  }
  if (!Number.isFinite(min) || min <= 0) return null;
  return Math.ceil(((MIN_PT * MM_V_PT * Number(vb[1])) / min) * 10) / 10;
}
