/**
 * Ход времени живых сцен (components/zhivye): модельное время t идёт от 0
 * до tMax с паузами-«снимками» на заданных отметках. Без React — её
 * проверяет scripts/check-zhivye.mjs, а сцены дают только числа.
 *
 * Разгон от старта и торможение к ближайшей остановке — скорость ∝ √пути,
 * как при равноускоренном движении: без рывка на старте и у отметки.
 * Положения на сцене всегда считаются от t, поэтому «замедленная съёмка»
 * у отметки не искажает подписи и графики.
 */

export interface HodOpcii {
  /** Конец шкалы времени. */
  tMax: number;
  /** Отметки-«снимки» внутри (0; tMax), по возрастанию. */
  ostanovki: readonly number[];
  /** Секунд показа на единицу модельного времени при скорости ×1. */
  sekNaEd: number;
  /** Пауза на снимке, с при скорости ×1. */
  sekSnimok: number;
  /** Длина разгона и торможения, единиц модельного времени. */
  razgon: number;
}

const MIN_DOLYA = 0.14;

/** Доля полной скорости хода времени. */
export function dolyaSkorosti(t: number, start: number, stop: number, razgon: number): number {
  const r = Math.sqrt(Math.max(0, t - start) / razgon) + MIN_DOLYA;
  const s = Math.sqrt(Math.max(0, stop - t) / razgon) + MIN_DOLYA;
  return Math.min(1, r, s);
}

/** Следующая остановка: первая отметка впереди, которую ещё не показывали; иначе конец. */
export function sleduyushayaOstanovka(o: HodOpcii, t: number, pokazano: number): number {
  for (let i = pokazano; i < o.ostanovki.length; i += 1) {
    const s = o.ostanovki[i] as number;
    if (s > t + 1e-9) return s;
  }
  return o.tMax;
}

/** Сколько снимков позади момента t (для перемотки). */
export function pokazanoDo(o: HodOpcii, t: number): number {
  return o.ostanovki.filter((s) => s <= t + 1e-9).length;
}

/** Шаг времени за кадр dtSek при скорости показа `skorost`. */
export function shagVremeni(
  o: HodOpcii,
  dtSek: number,
  skorost: number,
  t: number,
  start: number,
  stop: number,
): number {
  const polnyy = (dtSek * skorost) / o.sekNaEd;
  return Math.min(stop, t + polnyy * dolyaSkorosti(t, start, stop, o.razgon));
}

/** Число по-русски: запятая, до `znakov` знаков, без лишних нулей, типографский минус. */
export function ru(x: number, znakov = 2): string {
  const k = 10 ** znakov;
  const r = Math.round(x * k) / k;
  return String(Object.is(r, -0) ? 0 : r)
    .replace('.', ',')
    .replace('-', '−');
}

/** То же для KaTeX: запятая в фигурных скобках, обычный минус. */
export function ruTex(x: number, znakov = 2): string {
  return ru(x, znakov).replace(',', '{,}').replace('−', '-');
}

/**
 * Две подписи в ряду (центры c1 ≤ c2): раздвинуть от середины, если
 * налезают, и прижать к границам с сохранением зазора.
 */
export function razvesti(
  a: { c: number; w: number },
  b: { c: number; w: number },
  lo: number,
  hi: number,
  zazor: number,
): [number, number] {
  let c1 = a.c;
  let c2 = b.c;
  const nado = (a.w + b.w) / 2 + zazor;
  if (c2 - c1 < nado) {
    const mid = (c1 + c2) / 2;
    c1 = mid - nado / 2;
    c2 = mid + nado / 2;
  }
  if (c1 < lo + a.w / 2) {
    c1 = lo + a.w / 2;
    c2 = Math.max(c2, c1 + nado);
  }
  if (c2 > hi - b.w / 2) {
    c2 = hi - b.w / 2;
    c1 = Math.min(c1, c2 - nado);
  }
  return [c1, c2];
}

export function prizhat(c: number, w: number, lo: number, hi: number): number {
  return Math.min(Math.max(c, lo + w / 2), hi - w / 2);
}

/** Грубая ширина текста 13 px (жирный Inter) — запас для проверок без браузера. */
export function shirinaPriblizitelno(text: string, px = 13): number {
  return text.length * px * 0.58;
}
