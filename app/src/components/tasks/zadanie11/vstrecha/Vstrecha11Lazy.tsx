'use client';

import { LenivoeMesto } from '@/components/zhivye/LenivoeMesto';
import { VSTRECHA11 } from '@/content/tekstovye11';

const zagruzit = () => import('./Scena');

/**
 * Ленивая загрузка сцены «Встречное движение»: код сцены, её стили и
 * KaTeX для решения приходят отдельным куском, когда блок подходит к
 * экрану (за 600 px). До этого — стеклянная заглушка той же высоты,
 * чтобы страница не прыгала.
 */
export function Vstrecha11Lazy() {
  return (
    <LenivoeMesto
      zagruzit={zagruzit}
      className="z11-vst__mesto"
      zaglushka={
        <div className="z11-vst__zaglushka" role="status">
          <span>{VSTRECHA11.zagruzka}</span>
        </div>
      }
    />
  );
}
