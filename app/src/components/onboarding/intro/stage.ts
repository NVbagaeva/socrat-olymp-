/**
 * «Сцена» заставки — рамка слоя A (FRAME × FRAME px исходника) на экране.
 * В этой системе стоят и слои цветка, и 3D-корона (CROWN_PX px рамки на
 * единицу сцены), и эффекты. Положение рамки на экране:
 *   экран = (x, y) + точка рамки · k.
 *
 * До T_FLOWER рамка в центре кадра (кадры 1–3), с T_FLOWER до T_CARD —
 * плавный переход к позе над окном (кадры 4 и 5).
 */

import { BASE, FRAME, LAYERS } from './layers.gen';
import { T_CARD, T_FLOWER, easeInOutCubic, span } from './timeline';

export interface Stage {
  /** Экранная точка угла рамки, CSS px. */
  x: number;
  y: number;
  /** CSS px на px рамки. */
  k: number;
}

/** Насколько нижняя вершина заходит за верхний край окна, px. */
export const CARD_OVERLAP = 14;
/** Верх цветка в рамке — верх слоя A. */
const TOP = LAYERS.A.y;

function at(base: { x: number; y: number }, k: number): Stage {
  return { x: base.x - BASE.x * k, y: base.y - BASE.y * k, k };
}

/**
 * Цветок в центре кадра: на компьютере ≈ 0,7 высоты экрана (кадр 3),
 * на телефоне — по ширине.
 */
export function introStage(view: { w: number; h: number }, phone: boolean): Stage {
  const k = Math.min((0.7 * view.h) / (BASE.y - TOP + 55), (0.94 * view.w) / FRAME);
  return at({ x: view.w / 2, y: (phone ? 0.64 : 0.8) * view.h }, k);
}

/**
 * Над окном: на компьютере цветок около половины высоты экрана и не уже
 * 0,44 ширины (кадр 4), на телефоне почти во всю ширину — верхняя треть
 * (кадр 5). Сверху — не выше отступа; нижняя вершина за краем окна.
 */
export function finalStage(
  view: { w: number; h: number },
  card: { top: number; cx: number },
  sheet: boolean,
): Stage {
  const base = { x: card.cx, y: card.top + CARD_OVERLAP };
  const room = (base.y - (sheet ? 12 : 20)) / (BASE.y - TOP);
  const want = sheet
    ? (0.9 * view.w) / FRAME
    : Math.max((0.5 * view.h) / (BASE.y - TOP), (0.44 * view.w) / FRAME);
  return at(base, Math.max(0.05, Math.min(room, want)));
}

/** Рамка в момент t: интро → поза над окном. */
export function stageAt(t: number, intro: Stage, final: Stage): Stage {
  const q = easeInOutCubic(span(t, T_FLOWER, T_CARD));
  const k = Math.exp(Math.log(intro.k) + (Math.log(final.k) - Math.log(intro.k)) * q);
  const bx =
    intro.x + BASE.x * intro.k + (final.x + BASE.x * final.k - (intro.x + BASE.x * intro.k)) * q;
  const by =
    intro.y + BASE.y * intro.k + (final.y + BASE.y * final.k - (intro.y + BASE.y * intro.k)) * q;
  return at({ x: bx, y: by }, k);
}
