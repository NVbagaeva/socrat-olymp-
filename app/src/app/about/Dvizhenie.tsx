'use client';

import { useEffect } from 'react';

/* Блоки с data-reveal проявляются при прокрутке. Скрытое состояние
   включается классом .oa--js только после запуска скрипта — без него
   страница видна целиком. При prefers-reduced-motion ничего не
   включается. */
export function Dvizhenie() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('.oa');
    if (!root) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    root.classList.add('oa--js');
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
    root.querySelectorAll<HTMLElement>('[data-reveal]').forEach((block) => seen.observe(block));

    return () => {
      seen.disconnect();
      root.classList.remove('oa--js');
    };
  }, []);

  return null;
}
