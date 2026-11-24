'use client';

import type { ComponentType } from 'react';
import { LenivoeMesto } from './LenivoeMesto';

/**
 * Ленивая загрузка живой сцены: код сцены, её стили и KaTeX приходят
 * отдельным куском, когда блок подходит к экрану (за 600 px) или страницу
 * отправляют на печать (LenivoeMesto). До этого — стеклянная заглушка
 * заданной высоты, чтобы страница не прыгала.
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
  return (
    <LenivoeMesto
      zagruzit={zagruzit}
      className="zv-mesto"
      {...(props === undefined ? {} : { props })}
      zaglushka={
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
      }
    />
  );
}
