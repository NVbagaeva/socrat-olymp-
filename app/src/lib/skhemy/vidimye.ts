/**
 * Видимые параметры чертежа: схематично, но верно по смыслу.
 *
 * Чертёж задачи не обязан совпадать с числами один в один — он обязан
 * читаться на листе A4. Окружности радиусов 25 и 4 в точной пропорции —
 * крошечный кружок у большого; отрезки 2 и 12 — подпись «2» не влезает.
 * Поэтому сцену строят по видимым параметрам — подобранным для рисунка,
 * а числа в подписях берут из настоящих (sPodpisyamiIz).
 *
 * Сохраняется всё качественное: касание остаётся касанием, порядок
 * точек, тип фигуры, «что больше» — сжатие монотонно, равные остаются
 * равными. Сглаживаются только крайние пропорции.
 *
 * Пороги — общие для всех чертежей движка; по ним меряет
 * scripts/check-chertezhi-18.mjs (мерки — scripts/lib/mery-chertezha.mjs).
 */

import type { Element, Tochki, ZhivayaSkhema } from './tipy';

export const POROGI_CHERTEZHA = {
  /** Ширина чертежа на листе генератора, мм (lib/zadanie18/gen/list18.ts). */
  shirinaMm: 62,
  /** Наибольший подписанный отрезок к наименьшему — не больше. */
  otnoshenieOtrezkov: 3,
  /** Наибольший радиус к наименьшему — не больше. */
  otnoshenieRadiusov: 2.5,
  /** Наименьший радиус — доля размера чертежа (большей стороны рамки), не меньше. */
  radiusDolya: 0.09,
  /** Подписанный отрезок на листе, мм, — не короче (подпись в ~3 мм и поля вокруг). */
  otrezokMm: 8,
  /** Угол между линиями чертежа, градусы, — не уже. */
  ugol: 14.5,
  /** Подписанные точки — не ближе друг к другу, мм. */
  tochkiMm: 3.5,
} as const;

/**
 * Показатель степени, при котором наибольшее к наименьшему из vals
 * станет не больше max: 1 — сжимать не нужно.
 */
export function stepenSzhatiya(vals: readonly number[], max: number): number {
  const pol = vals.filter((v) => v > 0 && Number.isFinite(v));
  if (pol.length < 2) return 1;
  const r = Math.max(...pol) / Math.min(...pol);
  return r <= max ? 1 : Math.log(max) / Math.log(r);
}

/**
 * Сжать пропорции набора положительных величин степенью около их
 * среднего геометрического: v → g·(v / g)^α. Порядок и равенства
 * сохраняются, произведения и отношения — тоже (AP·PB = CP·PD остаётся
 * равенством), неравенство треугольника — тоже (степень α ≤ 1
 * полуаддитивна). Наибольшее к наименьшему — не больше max.
 *
 * proizvodnye — величины чертежа, которые следуют из этих по
 * произведениям и частным (PD = AP·PB / CP): их пропорции учитываются.
 */
export function szhat<K extends string>(
  p: Readonly<Record<string, number>>,
  klyuchi: readonly K[],
  max: number,
  proizvodnye: (x: Readonly<Record<string, number>>) => number[] = () => [],
): Record<string, number> {
  const vals = klyuchi.map((k) => p[k] ?? 0);
  const alpha = stepenSzhatiya([...vals, ...proizvodnye(p)], max);
  if (alpha >= 1) return { ...p };
  const g = Math.exp(vals.reduce((s, v) => s + Math.log(v), 0) / vals.length);
  const out: Record<string, number> = { ...p };
  for (const k of klyuchi) out[k] = g * ((p[k] ?? g) / g) ** alpha;
  return out;
}

/** Ограничить величину отрезком [ot; do]. */
export const vPredelah = (x: number, ot: number, doo: number) => Math.min(doo, Math.max(ot, x));

function teZheTochki(a: Tochki, b: Tochki): boolean {
  const ka = Object.keys(a);
  return (
    ka.length === Object.keys(b).length &&
    ka.every((k) => b[k] !== undefined && a[k]![0] === b[k]![0] && a[k]![1] === b[k]![1])
  );
}

/**
 * Сцена по видимым параметрам с подписями настоящих: у каждой величины
 * (velichina) видимой сцены текст — из точной сцены (по id элемента).
 * Числа на чертеже — из задачи, геометрия — читаемая.
 *
 * Живая схема (опорная задача) так рисуется в начальном положении
 * (и значения под чертежом — тоже из точной);
 * когда точку потянули, подписи снова считаются по чертежу.
 */
export function sPodpisyamiIz(tochnaya: ZhivayaSkhema, vidimaya: ZhivayaSkhema): ZhivayaSkhema {
  if (tochnaya === vidimaya) return tochnaya;
  const teksty = new Map<string, string>();
  const tochnyyKadr = tochnaya.postroit(tochnaya.nachalo);
  for (const el of tochnyyKadr.elementy) if (el.vid === 'velichina') teksty.set(el.id, el.tekst);
  const zamenit = (el: Element): Element =>
    el.vid === 'velichina' && teksty.has(el.id) ? { ...el, tekst: teksty.get(el.id)! } : el;
  return {
    ...vidimaya,
    postroit: (t, rezhim) => {
      const k = vidimaya.postroit(t, rezhim);
      if (!teZheTochki(t, vidimaya.nachalo)) return k;
      /* Значения под чертежом — тоже по числам задачи. */
      return {
        ...k,
        elementy: k.elementy.map(zamenit),
        znacheniya: tochnyyKadr.znacheniya,
        zametka: tochnyyKadr.zametka,
      };
    },
  };
}
