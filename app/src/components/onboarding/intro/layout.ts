/**
 * Где цветок на экране. Общие правила для живой сцены и для статичного
 * кадра: финальная поза и картинка-заглушка стоят в одном и том же месте
 * над окном, поэтому переход между ними незаметен.
 *
 * Масштаб — сколько CSS-пикселей занимает единица сцены. В единицах
 * сцены: октаэдр от центра до вершины — 1, нижняя вершина — в нуле.
 */

/** Ширина распустившегося цветка (кончики нижнего яруса граней). */
export const FLOWER_W = 3.7;
/** Высота от нижней вершины до кончика верхнего лепестка. */
export const FLOWER_H = 2.75;
/** Насколько нижняя вершина заходит за верхний край окна, px. */
export const CARD_OVERLAP = 14;

export interface Anchor {
  /** Экранная точка нижней вершины, CSS px от левого верхнего угла холста. */
  x: number;
  y: number;
  /** CSS px на единицу сцены. */
  unitPx: number;
}

/**
 * Финальная поза: цветок над окном, нижняя вершина — за его верхним
 * краем. На компьютере цветок ≈ 45 % ширины экрана (кадр 4), на
 * телефоне почти во всю ширину (кадр 5); сверху — не выше отступа.
 */
export function finalAnchor(
  view: { w: number; h: number },
  card: { top: number; cx: number },
  sheet: boolean,
): Anchor {
  const top = sheet ? 20 : 28;
  const byWidth = ((sheet ? 0.88 : 0.45) * view.w) / FLOWER_W;
  const byHeight = (card.top + CARD_OVERLAP - top) / FLOWER_H;
  return {
    x: card.cx,
    y: card.top + CARD_OVERLAP,
    unitPx: Math.max(40, Math.min(byWidth, byHeight)),
  };
}

/**
 * Статичный кадр: картинка финальной позы с прозрачным фоном.
 * Отрисована scripts/build-intro-still.mjs с этим масштабом; нижняя
 * вершина — в точке (bx, by) картинки. Размеры — в CSS px при 1×.
 */
export const STILL = {
  w: 900,
  h: 720,
  bx: 450,
  by: 640,
  unitPx: 200,
  src: '/onboarding/intro-still.webp',
  srcSmall: '/onboarding/intro-still-sm.webp',
} as const;

/** Положение и размер картинки статичного кадра для данной позы. */
export function stillBox(a: Anchor): { left: number; top: number; width: number; height: number } {
  const k = a.unitPx / STILL.unitPx;
  return {
    left: a.x - STILL.bx * k,
    top: a.y - STILL.by * k,
    width: STILL.w * k,
    height: STILL.h * k,
  };
}
