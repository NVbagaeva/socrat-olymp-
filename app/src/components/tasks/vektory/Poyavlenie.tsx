'use client';

import { useEffect } from 'react';

/**
 * Появление блоков при прокрутке: элементы с data-reveal внутри корня
 * всплывают, когда доходят до экрана.
 *
 * Без скрипта и при prefers-reduced-motion всё видно сразу: класс
 * is-reveal на корне ставится только здесь и только если движение не
 * отключено, а прятать до появления CSS начинает лишь под этим классом.
 */
export function Poyavlenie({ root }: { root: string }) {
  useEffect(() => {
    const node = document.querySelector<HTMLElement>(root);
    if (node === null) return;
    if (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      !('IntersectionObserver' in window)
    ) {
      return;
    }
    const items = [...node.querySelectorAll<HTMLElement>('[data-reveal]')];
    /* То, что уже на экране при загрузке, не прячем: без мигания. */
    const fresh = items.filter((el) => el.getBoundingClientRect().top > window.innerHeight);
    for (const el of fresh) el.classList.add('is-hidden');
    node.classList.add('is-reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.remove('is-hidden');
            entry.target.classList.add('is-in');
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );
    for (const el of fresh) observer.observe(el);
    return () => observer.disconnect();
  }, [root]);
  return null;
}
