'use client';

import { useEffect } from 'react';
import { MOTION_KADRY_KEY, MOTION_LEVEL_ATTR, podskazkiLite, zameritKadry } from '@/lib/motion';

/**
 * Уровень движения на <html> (lib/motion.ts): замер кадров и смена
 * «Уменьшить движение» в системе на ходу. Ничего не рисует.
 *
 * Замер — не сразу после загрузки: первые секунды страница
 * гидратируется, а Next.js предзагружает ссылки в виду, и кадры в это
 * время медленные на любом устройстве. Ждём простоя браузера (не
 * больше 4 с) — иначе слабым посчитался бы и быстрый компьютер.
 */
export function MotionLevel() {
  useEffect(() => {
    let stop: () => void = () => {};
    let idle = 0;
    let timer = 0;
    const zapusk = () => {
      /* Safari до 18 requestIdleCallback не знает. */
      if (typeof window.requestIdleCallback === 'function') {
        idle = window.requestIdleCallback(() => (stop = zameritKadry()), { timeout: 4000 });
      } else {
        timer = setTimeout(() => (stop = zameritKadry()), 2000) as unknown as number;
      }
    };
    if (document.readyState === 'complete') zapusk();
    else window.addEventListener('load', zapusk, { once: true });

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const smena = () => {
      let zamer: string | null = null;
      try {
        zamer = sessionStorage.getItem(MOTION_KADRY_KEY);
      } catch {
        /* хранилище закрыто — решаем по подсказкам браузера */
      }
      const lite = podskazkiLite() || zamer === 'lite';
      document.documentElement.setAttribute(
        MOTION_LEVEL_ATTR,
        mq.matches ? 'reduce' : lite ? 'lite' : 'full',
      );
    };
    mq.addEventListener('change', smena);

    return () => {
      window.removeEventListener('load', zapusk);
      if (idle && typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(idle);
      clearTimeout(timer);
      stop();
      mq.removeEventListener('change', smena);
    };
  }, []);
  return null;
}
