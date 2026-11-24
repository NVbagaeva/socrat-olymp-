'use client';

import { useEffect, useRef, useState, type ComponentType } from 'react';
import { useYakorProkrutki } from './yakorProkrutki';

/**
 * Ленивая загрузка живой сцены: код сцены, её стили и KaTeX приходят
 * отдельным куском, когда блок подходит к экрану (за 600 px) или страницу
 * отправляют на печать. До этого — стеклянная заглушка заданной высоты,
 * чтобы страница не прыгала.
 *
 * `zagruzit` — функция с import() конкретной сцены: путь должен стоять в
 * коде буквально, чтобы сборщик выделил сцену в свой кусок.
 */
export function ZhivayaLazy<P extends object = Record<string, never>>({
  zagruzit,
  zagruzka,
  vysota,
  props,
}: {
  zagruzit: () => Promise<{ default: ComponentType<P> }>;
  /** Свойства сцены (например, id описания рисунка). */
  props?: P;
  zagruzka: string;
  /** Высота заглушки, px: на телефоне и на компьютере. */
  vysota: { uzko: number; shiroko: number };
}) {
  const yakor = useRef<HTMLDivElement>(null);
  useYakorProkrutki(yakor);
  const [Scena, setScena] = useState<ComponentType<P> | null>(null);

  useEffect(() => {
    const el = yakor.current;
    if (el === null) return undefined;
    let alive = true;
    let nachato = false;
    const nachat = () => {
      if (nachato) return;
      nachato = true;
      void zagruzit().then((mod) => {
        if (alive) setScena(() => mod.default);
      });
    };
    window.addEventListener('beforeprint', nachat);
    const io =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver((z) => z.some((x) => x.isIntersecting) && nachat(), {
            rootMargin: '600px 0px',
          });
    if (io === null) nachat();
    else io.observe(el);
    return () => {
      alive = false;
      io?.disconnect();
      window.removeEventListener('beforeprint', nachat);
    };
  }, [zagruzit]);

  return (
    <div ref={yakor} className="zv-mesto">
      {Scena === null ? (
        <div
          className="zv-zaglushka"
          role="status"
          style={
            {
              '--h-uzko': `${vysota.uzko}px`,
              '--h-shiroko': `${vysota.shiroko}px`,
            } as React.CSSProperties
          }
        >
          <span>{zagruzka}</span>
        </div>
      ) : (
        <Scena {...((props ?? {}) as P)} />
      )}
    </div>
  );
}
