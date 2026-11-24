'use client';

import { useEffect, useRef, useState, type ComponentType } from 'react';
import { useYakorProkrutki } from '@/components/zhivye/yakorProkrutki';
import { MYACH10 } from '@/content/zhivye10';

/**
 * Ленивая загрузка сцены «Мяч выше отметки»: код сцены, её стили и
 * KaTeX для решения приходят отдельным куском, когда блок подходит к
 * экрану (за 600 px) или страницу отправляют на печать. До этого —
 * стеклянная заглушка той же высоты.
 */
export function MyachLazy() {
  const yakor = useRef<HTMLDivElement>(null);
  useYakorProkrutki(yakor);
  const [Scena, setScena] = useState<ComponentType | null>(null);

  useEffect(() => {
    const el = yakor.current;
    if (el === null) return undefined;
    let alive = true;
    let nachato = false;
    const zagruzit = () => {
      if (nachato) return;
      nachato = true;
      void import('./Scena').then((mod) => {
        if (alive) setScena(() => mod.default);
      });
    };
    window.addEventListener('beforeprint', zagruzit);
    const io =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver(
            (zapisi) => {
              if (zapisi.some((z) => z.isIntersecting)) zagruzit();
            },
            { rootMargin: '600px 0px' },
          );
    if (io === null) zagruzit();
    else io.observe(el);
    return () => {
      alive = false;
      io?.disconnect();
      window.removeEventListener('beforeprint', zagruzit);
    };
  }, []);

  return (
    <div ref={yakor} className="z10-my__mesto">
      {Scena === null ? (
        <div className="z10-my__zaglushka" role="status">
          <span>{MYACH10.zagruzka}</span>
        </div>
      ) : (
        <Scena />
      )}
    </div>
  );
}
