/**
 * Уровень движения на этом устройстве — один на весь сайт
 * (docs/motion-system.md, раздел 6). Стоит атрибутом на <html>:
 *
 * - `full` — по умолчанию, всё движение;
 * - `lite` — слабое устройство или экономия трафика: остаются нажатия,
 *   отклик тренажёра, смена вкладок и проявление `opacity`; без
 *   параллакса, каскадов, сдвигов, счёта чисел и дрейфа свечений;
 * - `reduce` — в системе включено «Уменьшить движение»: состояния
 *   меняются сразу.
 *
 * Атрибут ставит встроенный скрипт в <head> до первой отрисовки
 * (MOTION_LEVEL_SCRIPT) — по подсказкам браузера и по прошлому замеру
 * кадров из sessionStorage. Сам замер — `zameritKadry()`, после загрузки
 * страницы: Safari не сообщает ни память, ни экономию трафика, и для
 * iPhone замер — единственный способ узнать, что устройство не тянет.
 *
 * Интро и котик №14 пока определяют слабость по-своему
 * (onboarding/intro/detect.ts, zadanie14/kotik3d) — их порог мягче,
 * и переход на этот модуль поменял бы их поведение.
 */

export type MotionLevel = 'full' | 'lite' | 'reduce';

/** Атрибут на <html>. */
export const MOTION_LEVEL_ATTR = 'data-motion-level';

/** Ключ sessionStorage: результат замера кадров на этой вкладке. */
export const MOTION_KADRY_KEY = 'budetege:motion-kadry';

/** Средний кадр дольше этого — устройство слабое (≈ 40 к/с и ниже). */
export const LITE_KADR_MS = 24;

/** Сколько кадров меряем. */
const KADROV = 30;

/**
 * Встроенный скрипт для <head>. Правила те же, что в `podskazkiLite`;
 * дублируются строкой, потому что скрипт выполняется до загрузки
 * бандла. Ошибка (например, закрытое хранилище) оставляет `full`.
 */
export const MOTION_LEVEL_SCRIPT =
  `(function(){try{var d=document.documentElement,n=navigator,l='full';` +
  `if(matchMedia('(prefers-reduced-motion: reduce)').matches)l='reduce';else{` +
  `var m=n.deviceMemory,c=n.hardwareConcurrency,s=null;` +
  `try{s=sessionStorage.getItem('${MOTION_KADRY_KEY}')}catch(e){}` +
  `if((m&&m<=3)||(c&&c<=2)||(c&&c<=4&&m&&m<=4)||(n.connection&&n.connection.saveData)||s==='lite')l='lite'}` +
  `d.setAttribute('${MOTION_LEVEL_ATTR}',l)}catch(e){}})()`;

interface NavigatorHints {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
}

/** Слабое ли устройство по подсказкам браузера (без замера кадров). */
export function podskazkiLite(nav: Navigator & NavigatorHints = navigator): boolean {
  const m = nav.deviceMemory;
  const c = nav.hardwareConcurrency;
  return Boolean(
    (m && m <= 3) || (c && c <= 2) || (c && c <= 4 && m && m <= 4) || nav.connection?.saveData,
  );
}

/** Текущий уровень — по атрибуту на <html>; до скрипта — `full`. */
export function motionLevel(): MotionLevel {
  if (typeof document === 'undefined') return 'full';
  const v = document.documentElement.getAttribute(MOTION_LEVEL_ATTR);
  return v === 'lite' || v === 'reduce' ? v : 'full';
}

/**
 * Замер кадров: средний кадр первых 30 кадров после загрузки страницы.
 * Медленно — уровень `lite` на <html> и в sessionStorage, чтобы
 * следующие страницы этой вкладки сразу открывались облегчёнными.
 * Меряется один раз за вкладку и только на уровне `full`. Вкладка в
 * фоне не меряется: браузер там почти не рисует кадры.
 */
export function zameritKadry(): () => void {
  if (motionLevel() !== 'full' || document.visibilityState !== 'visible') return () => {};
  try {
    if (sessionStorage.getItem(MOTION_KADRY_KEY) !== null) return () => {};
  } catch {
    return () => {};
  }
  let raf = 0;
  let start = 0;
  let count = 0;
  const tick = (t: number) => {
    if (count === 0) start = t;
    count += 1;
    if (count <= KADROV) {
      raf = requestAnimationFrame(tick);
      return;
    }
    if (document.visibilityState !== 'visible') return;
    const sredniy = (t - start) / KADROV;
    const lite = sredniy > LITE_KADR_MS;
    try {
      sessionStorage.setItem(MOTION_KADRY_KEY, lite ? 'lite' : 'full');
    } catch {
      /* хранилище закрыто — замер повторится на следующей странице */
    }
    if (lite && motionLevel() === 'full') {
      document.documentElement.setAttribute(MOTION_LEVEL_ATTR, 'lite');
    }
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}
