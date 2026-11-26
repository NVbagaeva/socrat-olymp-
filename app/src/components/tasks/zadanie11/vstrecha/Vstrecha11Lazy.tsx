'use client';

import { VSTRECHA11 } from '@/content/tekstovye11';
import { useLenivayaScena } from '@/components/zhivye/useLenivayaScena';

const zagruzit = () => import('./Scena');

/**
 * Ленивая загрузка сцены «Встречное движение»: код сцены, её стили и
 * KaTeX для решения приходят отдельным куском, когда блок подходит к
 * экрану (за 600 px). До этого — стеклянная
 * заглушка. Если она уже над экраном, место держит её высоту, пока
 * читатель не вернётся к блоку: иначе страница над ним вырастет и текст
 * прыгнет (components/zhivye/useLenivayaScena.ts).
 */
export function Vstrecha11Lazy() {
  const { yakor, Scena } = useLenivayaScena(zagruzit, { pechat: false });

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
