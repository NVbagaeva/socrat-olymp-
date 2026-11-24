'use client';

import { LenivoeMesto } from '@/components/zhivye/LenivoeMesto';
import { RASPAD10 } from '@/content/zhivye10';

const zagruzit = () => import('./Scena');

/**
 * Ленивая загрузка сцены «Распад изотопа»: код сцены, её стили и
 * KaTeX для решения приходят отдельным куском, когда блок подходит к
 * экрану (за 600 px) или страницу отправляют на печать. До этого —
 * стеклянная заглушка той же высоты.
 */
export function RaspadLazy() {
  return (
    <LenivoeMesto
      zagruzit={zagruzit}
      className="z10-rs__mesto"
      zaglushka={
        <div className="z10-rs__zaglushka" role="status">
          <span>{RASPAD10.zagruzka}</span>
        </div>
      }
    />
  );
}
