'use client';

import { useEffect, useRef } from 'react';

/* Порог с запасом в обе стороны: шапка сжимается, когда страница
   ушла вниз дальше ON, и возвращается, когда вернулась выше OFF. Между
   ними состояние не меняется — у самого верха шапка не мигает. */
const ON = 24;
const OFF = 8;

/**
 * Компактная шапка на прокрутке: ставит data-compact на ближайшую
 * .site-head, когда страница прокручена. Сам ничего не рисует (пустой
 * скрытый span — только чтобы найти шапку). Как выглядит компактная
 * шапка и почему содержимое под ней не прыгает — site.css.
 */
export function SiteHeadCompact() {
  const mark = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const head = mark.current?.closest<HTMLElement>('.site-head');
    if (!head) return undefined;
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const compact = head.hasAttribute('data-compact');
      if (!compact && y > ON) head.setAttribute('data-compact', '');
      else if (compact && y < OFF) head.removeAttribute('data-compact');
    };
    const onScroll = () => {
      if (frame === 0) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame !== 0) cancelAnimationFrame(frame);
    };
  }, []);

  return <span ref={mark} hidden />;
}
