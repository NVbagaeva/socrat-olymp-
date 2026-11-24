'use client';

import { useEffect, type RefObject } from 'react';

/**
 * Якорь прокрутки для ленивых сцен. Сцена грузится, когда блок в 600 px
 * от экрана — в том числе выше него. Если она выросла, пока блок целиком
 * выше экрана, всё под ним (то, что сейчас на экране) уезжает вниз.
 * Chrome и Firefox держат прокрутку сами (overflow-anchor), Safari —
 * нет: там прокрутку сдвигаем на прирост высоты вручную.
 */
export function useYakorProkrutki(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const el = ref.current;
    if (el === null || typeof ResizeObserver === 'undefined') return undefined;
    if (typeof CSS !== 'undefined' && CSS.supports?.('overflow-anchor', 'auto')) return undefined;
    let h = el.offsetHeight;
    const ro = new ResizeObserver(() => {
      const nh = el.offsetHeight;
      const d = nh - h;
      h = nh;
      if (d === 0) return;
      /* Прежний низ блока был выше верха экрана — компенсируем. */
      if (el.getBoundingClientRect().bottom - d <= 0) window.scrollBy(0, d);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
}
