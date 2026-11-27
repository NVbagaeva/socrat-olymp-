'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { assetUrl } from '@/lib/assetUrl';

/* Портрет первого экрана: фото в стеклянной рамке, за ним приглушённые
   окружность и парабола, у нижних углов — мраморный бюст и стеклянная
   пирамида.

   Курсор поворачивает фигуры: бюст и пирамида слегка разворачиваются и
   смещаются за мышью, рамка с фото — едва заметно. На телефоне то же
   делает прокрутка первого экрана. Стеклянная лента поверх фото стоит
   неподвижно: так спокойнее, и лицо она не задевает ни в каком
   положении фигур. При prefers-reduced-motion сцена неподвижна. */

export interface Lenta {
  src: string;
  width: number;
  height: number;
}

export function Stsena({ children, lenta }: { children: ReactNode; lenta: Lenta | null }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    const hero = el?.closest<HTMLElement>('.oa-hero');
    if (!el || !hero) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const myshka = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    /* now — что нарисовано, cel — куда идём; −1…1 по обеим осям. */
    const now = { x: 0, y: 0 };
    const cel = { x: 0, y: 0 };
    let frame = 0;

    const risuy = () => {
      frame = 0;
      let dalshe = false;
      for (const k of ['x', 'y'] as const) {
        const d = cel[k] - now[k];
        if (Math.abs(d) > 0.002) {
          now[k] += d * 0.12;
          dalshe = true;
        } else now[k] = cel[k];
      }
      el.style.setProperty('--px', now.x.toFixed(3));
      el.style.setProperty('--py', now.y.toFixed(3));
      if (dalshe) frame = requestAnimationFrame(risuy);
    };
    const zapusk = () => {
      if (frame === 0) frame = requestAnimationFrame(risuy);
    };
    const onMove = (e: PointerEvent) => {
      const b = hero.getBoundingClientRect();
      cel.x = Math.max(-1, Math.min(1, ((e.clientX - b.left) / b.width) * 2 - 1));
      cel.y = Math.max(-1, Math.min(1, ((e.clientY - b.top) / b.height) * 2 - 1));
      zapusk();
    };
    const onLeave = () => {
      cel.x = 0;
      cel.y = 0;
      zapusk();
    };
    const onScroll = () => {
      const t = Math.max(0, Math.min(1, window.scrollY / Math.max(1, hero.offsetHeight)));
      cel.x = t;
      cel.y = t * 0.6;
      zapusk();
    };

    if (myshka) {
      hero.addEventListener('pointermove', onMove);
      hero.addEventListener('pointerleave', onLeave);
    } else {
      window.addEventListener('scroll', onScroll, { passive: true });
    }
    return () => {
      hero.removeEventListener('pointermove', onMove);
      hero.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('scroll', onScroll);
      if (frame !== 0) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="oa-portret" ref={root}>
      <svg className="oa-portret__geo" viewBox="0 0 400 400" aria-hidden="true" focusable="false">
        <circle className="oa-portret__krug" cx="200" cy="200" r="186" />
        <path className="oa-portret__parabola" d="M24 40 Q200 520 376 40" />
      </svg>
      <figure className="oa-portret__ramka">{children}</figure>
      {lenta ? (
        <span className="oa-portret__lenta" aria-hidden="true">
          <img src={lenta.src} alt="" width={lenta.width} height={lenta.height} decoding="async" />
        </span>
      ) : null}
      <img
        className="oa-portret__byust"
        src={assetUrl('/images/author/bust-marble-400.webp')}
        srcSet={`${assetUrl('/images/author/bust-marble-400.webp')} 400w, ${assetUrl('/images/author/bust-marble-675.webp')} 675w`}
        sizes="(max-width: 767px) 90px, 140px"
        alt=""
        aria-hidden="true"
        width="675"
        height="900"
        decoding="async"
      />
      <img
        className="oa-portret__piramida"
        src={assetUrl('/images/glass/piramida-steklo.webp')}
        srcSet={`${assetUrl('/images/glass/piramida-steklo.webp')} 500w, ${assetUrl('/images/glass/piramida-steklo-large.webp')} 1000w`}
        sizes="(max-width: 767px) 80px, 120px"
        alt=""
        aria-hidden="true"
        width="500"
        height="443"
        decoding="async"
      />
    </div>
  );
}
