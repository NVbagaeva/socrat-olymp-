/**
 * Сценарий заставки: моменты и плавности. Чистые функции без WebGL —
 * их делят сцена, разметка (когда показать «Пропустить» и окно) и
 * проверки. Время — секунды от начала заставки.
 *
 * 0–0,8   октаэдр проявляется из сияния;
 * 0,8–2,0 раскрытие по развёртке от нижней вершины;
 * 2,0–3,5 распускается цветок;
 * 3,5–4,5 камера отъезжает, цветок встаёт над окном;
 * дальше цветок «дышит» и покачивается, к IDLE_STOP_S замирает.
 */

export const T_OCTA = 0.8;
export const T_UNFOLD = 2.0;
export const T_FLOWER = 3.5;
export const T_CARD = 4.5;
/** С этого момента «Пропустить» проявляется (200 мс) — к 0,5 с она видна. */
export const T_SKIP_VISIBLE = 0.3;
/** Окно начинает появляться — чуть раньше, чем цветок встанет на место. */
export const T_CARD_IN = 3.8;
/** Через столько секунд анимация останавливается на финальном кадре. */
export const IDLE_STOP_S = 20;

export const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x);

/** Доля отрезка [a, b], пройденная к моменту t. */
export const span = (t: number, a: number, b: number): number => clamp01((t - a) / (b - a));

export const smooth = (x: number): number => x * x * (3 - 2 * x);

export const easeOutCubic = (x: number): number => 1 - (1 - x) ** 3;

export const easeInOutCubic = (x: number): number =>
  x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;

/**
 * Раскрытие с пружинкой: плавный разгон, к концу лёгкий перелёт ≈ 3 %
 * и мягкое возвращение. Ровно 0 в начале и ровно 1 в конце.
 */
export function spring(x: number): number {
  const c = clamp01(x);
  const u = span(c, 0.55, 1);
  return smooth(c) + 0.075 * Math.sin(Math.PI * u) ** 2 * (1 - u);
}
