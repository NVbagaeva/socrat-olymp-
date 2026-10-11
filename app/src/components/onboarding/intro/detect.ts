/**
 * Анимировать ли заставку и насколько подробно. Статичный кадр вместо
 * анимации: просят меньше движения, мало памяти, включена экономия
 * трафика. Ещё одна причина — меньше 30 кадров/с в первую секунду —
 * выясняется на ходу, в IntroSplash. WebGL заставке не нужен; причина
 * 'no-webgl' осталась для режима прототипа «без WebGL».
 */

/** high — компьютер, low — телефон: меньше частиц. */
export type Tier = 'high' | 'low';

export type StaticReason = 'reduced-motion' | 'no-webgl' | 'device-memory' | 'save-data' | 'slow';

export interface IntroDecision {
  animated: boolean;
  reason: StaticReason | null;
  tier: Tier;
}

interface NavigatorHints {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
}

/** Телефон или планшет: палец вместо мыши и небольшой экран. */
export function isHandheld(): boolean {
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  return coarse && Math.min(window.screen.width, window.screen.height) < 820;
}

export function decideIntro(): IntroDecision {
  const tier: Tier = isHandheld() ? 'low' : 'high';
  const nav = navigator as Navigator & NavigatorHints;
  const still = (reason: StaticReason): IntroDecision => ({ animated: false, reason, tier });
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return still('reduced-motion');
  if (typeof nav.deviceMemory === 'number' && nav.deviceMemory < 4) return still('device-memory');
  if (nav.connection?.saveData === true) return still('save-data');
  return { animated: true, reason: null, tier };
}

/** Порог «медленно»: средняя частота кадров первой секунды. */
export const MIN_FPS = 30;
