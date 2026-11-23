/**
 * «Мяч выше отметки» — живая иллюстрация теории №9 (прикладные задачи,
 * раздел «Квадратные уравнения»): components/tasks/zadanie10/myach.
 * Чистая модель без React: высота, корни, ход времени, разметка сцены.
 * Её же проверяет scripts/check-myach-10.mjs.
 *
 * Высота мяча h(t) = 1,2 + 10t − 5t² (задача ФИПИ). Отметки H подобраны
 * так, чтобы корни выходили точными: t₁,₂ = 1 ∓ 0,2·√k при k = 1, 4, 9, 16.
 */

export const H0 = 1.2;
export const V0 = 10;
export const G2 = 5;

/** Отметки H, м, — все дают точные t₁ и t₂. */
export const OTMETKI = [3, 4.4, 5.4, 6] as const;
export const OTMETKA_DEFAULT = 6;

export function h(t: number): number {
  return H0 + V0 * t - G2 * t * t;
}

/** Вершина: момент и высота. */
export const T_VERSH = V0 / (2 * G2);
export const H_MAX = h(T_VERSH);
/** Момент падения на землю, с (≈ 2,11). */
export const T_KON = (V0 + Math.sqrt(V0 * V0 + 4 * G2 * H0)) / (2 * G2);

/** Моменты, когда мяч на высоте H: t₁ — вверх, t₂ — вниз. */
export function korni(H: number): { t1: number; t2: number; d: number } {
  const d = Math.sqrt(Math.max(0, (H_MAX - H) / G2));
  return { t1: kruglo(T_VERSH - d, 6), t2: kruglo(T_VERSH + d, 6), d: kruglo(d, 6) };
}

function kruglo(x: number, znakov: number): number {
  const k = 10 ** znakov;
  return Math.round(x * k) / k;
}

/** Число по-русски: запятая, до `znakov` знаков, без лишних нулей. */
export function ru(x: number, znakov = 2): string {
  const r = kruglo(x, znakov);
  return String(r).replace('.', ',').replace('-', '−');
}

/** То же для KaTeX: запятая в фигурных скобках. */
export function ruTex(x: number, znakov = 2): string {
  return ru(x, znakov).replace(',', '{,}').replace('−', '-');
}

/** Время для подписей — с точностью до 0,01 с. */
export function tPodpis(t: number): number {
  return kruglo(t, 2);
}

/* ── Проигрывание ───────────────────────────────────────────────── */

/** Секунд показа на одну секунду полёта при скорости ×1 (замедленная съёмка). */
export const SEK_NA_SEK = 2.6;
/** Пауза-«снимок» на t₁ и t₂, с при ×1. */
export const SEK_SNIMOK = 1.8;
/** Длина разгона и торможения, с модельного времени. */
const RAZGON = 0.12;
const MIN_DOLYA = 0.14;

/** Доля полной скорости: разгон от старта и торможение к остановке (∝ √пути). */
export function dolyaSkorosti(t: number, start: number, stop: number): number {
  const razgon = Math.sqrt(Math.max(0, t - start) / RAZGON) + MIN_DOLYA;
  const tormoz = Math.sqrt(Math.max(0, stop - t) / RAZGON) + MIN_DOLYA;
  return Math.min(1, razgon, tormoz);
}

/**
 * Следующая остановка: t₁ и t₂ — паузы-«снимки» (каждая один раз за
 * показ), затем падение. `pokazany` — сколько снимков уже было.
 */
export function sleduyushayaOstanovka(H: number, t: number, pokazany: number): number {
  const { t1, t2 } = korni(H);
  if (pokazany < 1 && t < t1) return t1;
  if (pokazany < 2 && t < t2) return t2;
  return T_KON;
}

export function shagVremeni(
  dtSek: number,
  skorost: number,
  t: number,
  start: number,
  stop: number,
): number {
  const polnyy = (dtSek * skorost) / SEK_NA_SEK;
  return Math.min(stop, t + polnyy * dolyaSkorosti(t, start, stop));
}

/* ── Разметка сцены, px ─────────────────────────────────────────── */

export interface Razmetka {
  W: number;
  H: number;
  uzkaya: boolean;
  pole: number;
  /** Пикселей на метр — общий для стойки и графика: мяч и точка графика на одной высоте. */
  pxM: number;
  /** y земли (h = 0) и верх шкалы (h = 7 м). */
  yZemlya: number;
  /** Стойка: x линейки, x бросающего (ступни), x мяча. */
  xLineyka: number;
  xChelovek: number;
  xMyach: number;
  rMyach: number;
  /** Граница стойки и графика. */
  xRazdel: number;
  /** График: x для t = 0 и t = tMax. */
  gx0: number;
  gx1: number;
  tMax: number;
  /** Ряды под осью t: деления, t₁ и t₂, длина промежутка. */
  yDeleniya: number;
  yKorni: number;
  yPromezhutok: number;
}

export const H_SHKALY = 7;

export function razmetka(W: number): Razmetka {
  const uzkaya = W < 560;
  const pole = uzkaya ? 8 : 16;
  const H = uzkaya ? 330 : 380;
  const yZemlya = H - (uzkaya ? 80 : 86);
  const verh = 24;
  const pxM = (yZemlya - verh) / H_SHKALY;
  const xLineyka = pole + 26;
  const shirinaStoyki = uzkaya ? Math.max(104, W * 0.32) : Math.min(230, Math.max(170, W * 0.27));
  const xRazdel = pole + shirinaStoyki;
  const xChelovek = xLineyka + (xRazdel - xLineyka) * 0.42;
  const gx0 = xRazdel + (uzkaya ? 30 : 40);
  const gx1 = W - pole - (uzkaya ? 10 : 18);
  return {
    W,
    H,
    uzkaya,
    pole,
    pxM,
    yZemlya,
    xLineyka,
    xChelovek,
    xMyach: xChelovek + 0.42 * pxM,
    rMyach: Math.max(9, 0.28 * pxM),
    xRazdel,
    gx0,
    gx1,
    tMax: 2.4,
    yDeleniya: yZemlya + 18,
    yKorni: yZemlya + 42,
    yPromezhutok: yZemlya + 66,
  };
}

export function yH(r: Razmetka, hh: number): number {
  return r.yZemlya - hh * r.pxM;
}

export function xT(r: Razmetka, t: number): number {
  return r.gx0 + ((r.gx1 - r.gx0) * t) / r.tMax;
}

/** Деления оси t: шаг 0,5 с, или 1 с, если не помещается. */
export function deleniyaT(r: Razmetka): number[] {
  const pxSek = (r.gx1 - r.gx0) / r.tMax;
  const shag = pxSek * 0.5 >= 34 ? 0.5 : 1;
  const out: number[] = [];
  for (let t = 0; t <= r.tMax - 0.1 + 1e-9; t += shag) out.push(kruglo(t, 2));
  return out;
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

export function shirinaPriblizitelno(text: string, px: number): number {
  return text.length * px * 0.58;
}
