/**
 * Яндекс Метрика: номер счётчика и цели.
 *
 * Номер — переменная окружения сборки NEXT_PUBLIC_METRIKA_ID
 * (Settings → Secrets and variables → Actions → Variables). Пусто —
 * счётчика на сайте нет, цели молча не отправляются.
 *
 * Цели (заводятся в интерфейсе Метрики как «JavaScript-событие» с
 * тем же идентификатором):
 *   trenirovka_start   — начал тренировку (любой тренажёр раздела);
 *   variant_sobran     — сформировал вариант («Собрать вариант» или
 *                        генератор раздела), параметр istochnik;
 *   blank_skachan      — скачал бланк ЕГЭ, параметр blank.
 */

export const METRIKA_ID = process.env.NEXT_PUBLIC_METRIKA_ID ?? '';

export type MetrikaCel = 'trenirovka_start' | 'variant_sobran' | 'blank_skachan';

type Ym = ((id: number, method: string, ...args: unknown[]) => void) & {
  a?: unknown[];
  l?: number;
};

/** Настройки счётчика: просмотры отправляем сами (defer), вебвизор выключен. */
const INIT = {
  defer: true,
  clickmap: true,
  trackLinks: true,
  accurateTrackBounce: true,
  webvisor: false,
};

/**
 * Функция ym. Пока файл счётчика не загружен — стандартная очередь
 * Метрики: вызовы копятся в ym.a и уходят при загрузке, первым — init.
 */
function ym(): Ym | null {
  if (METRIKA_ID === '' || typeof window === 'undefined') return null;
  const w = window as unknown as { ym?: Ym };
  if (typeof w.ym !== 'function') {
    const stub: Ym = (...args: unknown[]) => {
      (stub.a ??= []).push(args);
    };
    stub.l = Date.now();
    w.ym = stub;
    stub(Number(METRIKA_ID), 'init', INIT);
  }
  return w.ym;
}

/** Отправить цель. */
export function cel(name: MetrikaCel, params?: Record<string, string | number>): void {
  try {
    ym()?.(Number(METRIKA_ID), 'reachGoal', name, params);
  } catch {
    /* Счётчик не должен ронять страницу. */
  }
}

/** Просмотр страницы, и первой, и при переходе внутри сайта (счётчик заведён с defer: true). */
export function prosmotr(url: string, referer: string | undefined): void {
  try {
    ym()?.(Number(METRIKA_ID), 'hit', url, referer === undefined ? {} : { referer });
  } catch {
    /* Счётчик не должен ронять страницу. */
  }
}
