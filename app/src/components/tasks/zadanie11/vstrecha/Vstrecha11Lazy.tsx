'use client';

import { useEffect, useRef, useState, type ComponentType } from 'react';
import { VSTRECHA11 } from '@/content/tekstovye11';

/**
 * Ленивая загрузка сцены «Встречное движение»: код сцены, её стили и
 * KaTeX для решения приходят отдельным куском, когда блок подходит к
 * экрану (за 600 px). До этого — стеклянная заглушка той же высоты,
 * чтобы страница не прыгала.
 */
export function Vstrecha11Lazy() {
  const yakor = useRef<HTMLDivElement>(null);
  const [Scena, setScena] = useState<ComponentType | null>(null);

  useEffect(() => {
    const el = yakor.current;
    if (el === null) return undefined;
    let alive = true;
    const zagruzit = () => {
      void import('./Scena').then((mod) => {
        if (alive) setScena(() => mod.default);
      });
    };
    if (typeof IntersectionObserver === 'undefined') {
      zagruzit();
      return () => {
        alive = false;
      };
    }
    const io = new IntersectionObserver(
      (zapisi) => {
        if (zapisi.some((z) => z.isIntersecting)) {
          io.disconnect();
          zagruzit();
        }
      },
      { rootMargin: '600px 0px' },
    );
    io.observe(el);
    return () => {
      alive = false;
      io.disconnect();
    };
  }, []);

  return (
    <div ref={yakor} className="z11-vst__mesto">
      {Scena === null ? (
        <div className="z11-vst__zaglushka" role="status">
          <span>{VSTRECHA11.zagruzka}</span>
        </div>
      ) : (
        <Scena />
      )}
    </div>
  );
}
