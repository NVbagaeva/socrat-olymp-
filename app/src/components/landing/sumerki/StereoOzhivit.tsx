'use client';

import { useEffect, useRef } from 'react';
import type { Model } from '@/lib/solid/model';

/**
 * Оживитель живой фигуры витрины. В первой загрузке главной — только он:
 * когда часть подъезжает к экрану (или её тронули раньше), подгружается
 * stereoOzhivlenie вместе с движком рисунка и вешает поведение на
 * разметку, которую StereoChast нарисовал на сборке.
 */
export function StereoOzhivit({
  model,
  az,
  el,
  nachalo,
}: {
  model: Model;
  az: number;
  el: number;
  nachalo: number;
}) {
  const metka = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const koren = metka.current?.closest<HTMLElement>('.vit-chast--stereo');
    if (koren == null) return undefined;
    let uborka: (() => void) | null = null;
    let zhivo = true;
    let nachato = false;
    const nachat = () => {
      if (nachato) return;
      nachato = true;
      podyezd.disconnect();
      koren.removeEventListener('pointerover', nachat);
      koren.removeEventListener('focusin', nachat);
      void import('./stereoOzhivlenie').then((m) => {
        if (zhivo) uborka = m.ozhivit(koren, { model, az, el, nachalo });
      });
    };
    const podyezd = new IntersectionObserver(
      (es) => {
        if (es.some((e) => e.isIntersecting)) nachat();
      },
      { rootMargin: '600px 0px' },
    );
    podyezd.observe(koren);
    koren.addEventListener('pointerover', nachat);
    koren.addEventListener('focusin', nachat);
    return () => {
      zhivo = false;
      podyezd.disconnect();
      koren.removeEventListener('pointerover', nachat);
      koren.removeEventListener('focusin', nachat);
      uborka?.();
    };
  }, [model, az, el, nachalo]);
  return <span ref={metka} hidden />;
}
