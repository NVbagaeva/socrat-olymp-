'use client';

import { useEffect } from 'react';

/**
 * Наведение на сцену шапки ускоряет знаки на орбите: скорость
 * CSS-анимации меняется через Web Animations (playbackRate) — без
 * скачка, знаки продолжают с того же места.
 */
export function ScenaUskorenie() {
  useEffect(() => {
    const el = document.getElementById('us-scena');
    if (el === null || typeof el.getAnimations !== 'function') return undefined;
    const skorost = (r: number) => {
      for (const a of el.getAnimations({ subtree: true })) {
        if (a instanceof CSSAnimation && a.animationName === 'us-orbita') a.updatePlaybackRate(r);
      }
    };
    const vhod = () => skorost(3);
    const vyhod = () => skorost(1);
    el.addEventListener('pointerenter', vhod);
    el.addEventListener('pointerleave', vyhod);
    return () => {
      el.removeEventListener('pointerenter', vhod);
      el.removeEventListener('pointerleave', vyhod);
    };
  }, []);
  return null;
}
