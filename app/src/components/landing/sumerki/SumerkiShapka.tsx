'use client';

import { useEffect } from 'react';

/**
 * Шапка над тёмной сценой — тёмное стекло. Когда под шапкой начинается
 * светлая часть страницы, она плавно становится обычной светлой
 * стеклянной шапкой: атрибут data-svet на .site-head--sumerki, цвета —
 * sumerki.css. Без скриптов шапка остаётся тёмной только над сценой —
 * сцена в первом экране, так что светлый текст на светлом не окажется.
 */
export function SumerkiShapka() {
  useEffect(() => {
    const shapka = document.querySelector<HTMLElement>('.site-head--sumerki');
    const scena = document.querySelector<HTMLElement>('.sm--a .sm__okno');
    if (shapka === null || scena === null) return undefined;
    let raf = 0;
    const proverit = () => {
      raf = 0;
      /* Светлая часть начинается там, где кончается переход сцены. */
      const perehod =
        parseFloat(getComputedStyle(scena).getPropertyValue('--sumerki-perehod')) || 260;
      const niz = scena.getBoundingClientRect().bottom - perehod * 0.5;
      shapka.toggleAttribute('data-svet', niz <= shapka.getBoundingClientRect().bottom);
    };
    const onScroll = () => {
      if (raf === 0) raf = requestAnimationFrame(proverit);
    };
    proverit();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);
  return null;
}
