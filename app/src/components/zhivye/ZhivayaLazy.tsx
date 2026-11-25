'use client';

import type { ComponentType } from 'react';
import { useLenivayaScena } from './useLenivayaScena';

/**
 * Ленивая загрузка живой сцены: код сцены, её стили и KaTeX приходят
 * отдельным куском, когда блок подходит к экрану (за 600 px) или страницу
 * отправляют на печать. До этого — стеклянная заглушка заданной высоты.
 * Если заглушка уже над экраном, место держит её высоту, пока читатель не
 * вернётся к блоку: иначе страница над ним вырастет и текст прыгнет
 * (useLenivayaScena).
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
  const { yakor, Scena } = useLenivayaScena(zagruzit);

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
