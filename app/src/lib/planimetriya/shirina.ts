/**
 * Ширина чертежа №1 на листе, мм — отдельным лёгким модулем: её берут
 * лист №1 (sheet1.ts) и «Собрать вариант» (lib/variant/adapters/z01),
 * которому весь лист с рамками теории не нужен.
 */

/** Ширина чертежа на листе, мм: по ширине SVG, не шире колонки и не выше maxVysota. */
export function shirinaRisunka(svg: string | null, max = 52, maxVysota = 42): number {
  const w = Number(/width="([0-9.]+)"/.exec(svg ?? '')?.[1] ?? 0);
  const h = Number(/height="([0-9.]+)"/.exec(svg ?? '')?.[1] ?? 0);
  /* Высокий узкий чертёж не растягивает задачу: по высоте не больше maxVysota мм. */
  const poVysote = h > 0 ? (maxVysota * w) / h : Infinity;
  return Math.max(12, Math.min(poVysote, Math.max(22, Math.min(max, Math.round(w * 0.18)))));
}
