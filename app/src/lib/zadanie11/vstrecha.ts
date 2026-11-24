/**
 * «Встречное движение» на «О задании» (components/tasks/zadanie11/vstrecha):
 * чистая модель без React — числа, время, разметка сцены и разведение
 * подписей. Её же проверяет scripts/check-vstrecha-11.mjs.
 *
 * Числа подобраны так, чтобы всё выходило «красиво»: скорости — целые,
 * время встречи — целое число часов, а расстояние — S = T · (v₁ + v₂).
 * Ползунок «расстояние» поэтому перебирает именно такие S.
 */

export interface VstrechaChisla {
  /** Скорость первого путника, км/ч. */
  v1: number;
  /** Скорость второго путника, км/ч. */
  v2: number;
  /** Время до встречи, ч (целое). */
  T: number;
}

export const VSTRECHA_DEFAULT: VstrechaChisla = { v1: 4, v2: 3, T: 2 };

/** Диапазоны ползунков. */
export const VSTRECHA_DIAPAZON = {
  v: { min: 2, max: 6 },
  T: { min: 1, max: 3 },
} as const;

/** Расстояние между городами, км. */
export function rasstoyanie(c: VstrechaChisla): number {
  return c.T * (c.v1 + c.v2);
}

/** Скорость сближения, км/ч. */
export function sblizhenie(c: VstrechaChisla): number {
  return c.v1 + c.v2;
}

/** Расстояния, которые доступны ползунку при этих скоростях. */
export function variantyRasstoyaniya(v1: number, v2: number): number[] {
  const out: number[] = [];
  for (let T = VSTRECHA_DIAPAZON.T.min; T <= VSTRECHA_DIAPAZON.T.max; T += 1) {
    out.push(T * (v1 + v2));
  }
  return out;
}

/** Где путники в момент t (км от города А). */
export function polozhenie(c: VstrechaChisla, t: number): { x1: number; x2: number } {
  const S = rasstoyanie(c);
  const tt = Math.min(Math.max(t, 0), c.T);
  return { x1: c.v1 * tt, x2: S - c.v2 * tt };
}

/**
 * Время для подписей — с точностью до 0,1 ч. Все числа на экране
 * считаются от него, поэтому «4 · 1,2 = 4,8» всегда сходится.
 */
export function tPodpis(t: number): number {
  return Math.round(t * 10) / 10;
}

/** Число по-русски: запятая, не больше одного знака после неё. */
export function ru(x: number): string {
  const r = Math.round(x * 10) / 10;
  const s = Number.isInteger(r) ? String(r) : r.toFixed(1);
  return s.replace('.', ',').replace('-', '−');
}

/* ── Проигрывание ───────────────────────────────────────────────── */

/** Секунд показа на один час пути при скорости ×1. */
export const SEK_NA_CHAS = 2.4;
/** Пауза-«снимок» на отметке 1 ч, с при скорости ×1. */
export const SEK_SNIMOK = 2.2;
/** Длина разгона и торможения, ч модельного времени. */
const RAZGON = 0.2;
/** Самая малая доля скорости: путники не «залипают» у отметки. */
const MIN_DOLYA = 0.14;

/**
 * Доля полной скорости хода времени: плавный разгон от точки, где
 * пуск, и торможение к ближайшей остановке. Скорость ∝ √пути — то же,
 * что равноускоренный разгон: без рывка на старте и у отметки.
 */
export function dolyaSkorosti(t: number, start: number, stop: number): number {
  const razgon = Math.sqrt(Math.max(0, t - start) / RAZGON) + MIN_DOLYA;
  const tormoz = Math.sqrt(Math.max(0, stop - t) / RAZGON) + MIN_DOLYA;
  return Math.min(1, razgon, tormoz);
}

/** Следующая остановка: отметка 1 ч (если снимок ещё не показан), иначе встреча. */
export function sleduyushayaOstanovka(
  c: VstrechaChisla,
  t: number,
  snimokPokazan: boolean,
): number {
  if (c.T > 1 && !snimokPokazan && t < 1) return 1;
  return c.T;
}

/** Шаг времени за кадр dtSek при скорости показа `skorost`. */
export function shagVremeni(
  dtSek: number,
  skorost: number,
  t: number,
  start: number,
  stop: number,
): number {
  const polnyy = (dtSek * skorost) / SEK_NA_CHAS;
  return Math.min(stop, t + polnyy * dolyaSkorosti(t, start, stop));
}

/* ── Разметка сцены, px ─────────────────────────────────────────── */

export interface Razmetka {
  W: number;
  H: number;
  uzkaya: boolean;
  /** Поле по краям сцены. */
  pole: number;
  /** Дорога: x города А (0 км) и города В (S км), y — середина ленты. */
  x0: number;
  xS: number;
  yDoroga: number;
  /** Ширина картинки города. */
  gorod: number;
  /** Масштаб фигурки. */
  masshtab: number;
  /** Ряды подписей: скорость, отметки, пройденный путь, остаток. */
  yPlashka: number;
  yOtmetki: number;
  yProydeno: number;
  yOstalos: number;
}

export function razmetka(W: number): Razmetka {
  const uzkaya = W < 560;
  const pole = uzkaya ? 8 : 20;
  const gorod = uzkaya ? 70 : 128;
  const x0 = pole + Math.max(gorod * 0.5, 44);
  const xS = W - x0;
  return {
    W,
    H: uzkaya ? 262 : 286,
    uzkaya,
    pole,
    x0,
    xS,
    yDoroga: uzkaya ? 150 : 168,
    gorod,
    masshtab: uzkaya ? 0.82 : 1.12,
    yPlashka: 22,
    yOtmetki: uzkaya ? 178 : 196,
    yProydeno: uzkaya ? 210 : 228,
    yOstalos: uzkaya ? 242 : 264,
  };
}

/** Перевод км → px по дороге. */
export function kmVPx(r: Razmetka, S: number, km: number): number {
  return r.x0 + ((r.xS - r.x0) * km) / S;
}

/** Отметки дороги: мелкие штрихи каждый километр, подписи — с шагом, который помещается. */
export function otmetki(r: Razmetka, S: number): { shtrihi: number[]; podpisi: number[] } {
  const pxKm = (r.xS - r.x0) / S;
  const shtrihi: number[] = [];
  if (pxKm >= 5) for (let k = 0; k <= S; k += 1) shtrihi.push(k);
  const shag = [2, 4, 5, 10].find((s) => s * pxKm >= 26) ?? 10;
  const podpisi: number[] = [];
  for (let k = 0; k <= S; k += shag) {
    /* Последняя кратная отметка не должна налезать на подпись S. */
    if (k !== 0 && (S - k) * pxKm < 24 && k !== S) continue;
    podpisi.push(k);
  }
  if (podpisi[podpisi.length - 1] !== S) podpisi.push(S);
  return { shtrihi, podpisi };
}

/**
 * Две подписи в одном ряду: желаемые центры c1 ≤ c2 и ширины. Если
 * налезают — раздвигаются от середины поровну, затем прижимаются к
 * границам [lo, hi] с сохранением зазора. Порядок не меняется.
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
  const min1 = lo + a.w / 2;
  const max2 = hi - b.w / 2;
  if (c1 < min1) {
    c1 = min1;
    c2 = Math.max(c2, c1 + nado);
  }
  if (c2 > max2) {
    c2 = max2;
    c1 = Math.min(c1, c2 - nado);
  }
  return [c1, c2];
}

/** Одна подпись в ряду: центр прижимается к границам. */
export function prizhat(c: number, w: number, lo: number, hi: number): number {
  return Math.min(Math.max(c, lo + w / 2), hi - w / 2);
}

/** Грубая ширина текста, px: запасной вариант, когда нет canvas. */
export function shirinaPriblizitelno(text: string, px: number, zhirnyy = true): number {
  return text.length * px * (zhirnyy ? 0.58 : 0.54);
}

/* ── Фигурка: углы походки ──────────────────────────────────────── */

export interface Poza {
  /** Углы бедра и голени левой и правой ноги, градусы (вперёд — минус). */
  bedroL: number;
  golenL: number;
  bedroR: number;
  golenR: number;
  /** Плечо и локоть, градусы. */
  plechoL: number;
  lokotL: number;
  plechoR: number;
  lokotR: number;
  /** Подъём тела, px (вверх — минус), и наклон головы, градусы. */
  pod: number;
  golova: number;
}

/**
 * Поза на фазе шага φ (радианы) с размахом amp ∈ [0, 1]: amp = 0 —
 * стоит ровно. Нога в переносе (cos φ > 0) сгибается в колене; рука
 * идёт навстречу ноге своей стороны.
 */
export function poza(phi: number, amp: number): Poza {
  const s = Math.sin(phi);
  const c = Math.cos(phi);
  const koleno = (cc: number) => amp * (6 + 34 * Math.max(0, cc) ** 1.3);
  return {
    bedroL: -26 * amp * s,
    golenL: koleno(c),
    bedroR: 26 * amp * s,
    golenR: koleno(-c),
    plechoL: 22 * amp * s,
    lokotL: -amp * (14 + 10 * Math.max(0, c)),
    plechoR: -22 * amp * s,
    lokotR: -amp * (14 + 10 * Math.max(0, -c)),
    pod: -2.2 * amp * (1 - Math.abs(s)),
    golova: 2.5 * amp * Math.sin(2 * phi),
  };
}
