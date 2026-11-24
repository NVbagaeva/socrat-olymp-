'use client';

import { LenivoeMesto } from '@/components/zhivye/LenivoeMesto';
import { MYACH10 } from '@/content/zhivye10';

const zagruzit = () => import('./Scena');

/**
 * Ленивая загрузка сцены «Мяч выше отметки»: код сцены, её стили и
 * KaTeX для решения приходят отдельным куском, когда блок подходит к
 * экрану (за 600 px) или страницу отправляют на печать. До этого —
 * стеклянная заглушка той же высоты.
 */
export function MyachLazy() {
  return (
    <LenivoeMesto
      zagruzit={zagruzit}
      className="z10-my__mesto"
      zaglushka={
        <div className="z10-my__zaglushka" role="status">
          <span>{MYACH10.zagruzka}</span>
        </div>
      }
    />
  );
}
