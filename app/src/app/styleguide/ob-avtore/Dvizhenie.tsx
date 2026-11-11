'use client';

import { useEffect } from 'react';

/* Лёгкое движение страницы: блоки с data-reveal проявляются при
   прокрутке, элемент с data-parallax (бюст) едва заметно отстаёт от
   неё. Скрытое состояние включается классом .oa--js только после
   запуска скрипта — без него страница видна целиком. При
   prefers-reduced-motion ничего не включается. */
export function Dvizhenie() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('.oa');
    if (!root) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    root.classList.add('oa--js');
    const blocks = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'));
    const seen = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            seen.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
    );
    blocks.forEach((block) => seen.observe(block));

    const layers = Array.from(root.querySelectorAll<HTMLElement>('[data-parallax]'));
    let frame = 0;
    const move = () => {
      frame = 0;
      const half = window.innerHeight / 2;
      for (const layer of layers) {
        const box = layer.parentElement?.getBoundingClientRect();
        if (!box || box.bottom < 0 || box.top > window.innerHeight) continue;
        /* −1…1: где центр блока относительно центра экрана. */
        const t = Math.max(-1, Math.min(1, (box.top + box.height / 2 - half) / half));
        layer.style.transform = `translate3d(0, ${(t * 14).toFixed(1)}px, 0)`;
      }
    };
    const onScroll = () => {
      if (frame === 0) frame = requestAnimationFrame(move);
    };
    move();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      seen.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame !== 0) cancelAnimationFrame(frame);
      root.classList.remove('oa--js');
    };
  }, []);

  return null;
}
