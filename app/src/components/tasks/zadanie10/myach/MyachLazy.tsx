'use client';

import { MYACH10 } from '@/content/zhivye10';
import { useLenivayaScena } from '@/components/zhivye/useLenivayaScena';

const zagruzit = () => import('./Scena');

/**
 * Ленивая загрузка сцены «Мяч выше отметки»: код сцены, её стили и
 * KaTeX для решения приходят отдельным куском, когда блок подходит к
 * экрану (за 600 px) или страницу отправляют на печать. До этого — стеклянная
 * заглушка. Если она уже над экраном, место держит её высоту, пока
 * читатель не вернётся к блоку: иначе страница над ним вырастет и текст
 * прыгнет (components/zhivye/useLenivayaScena.ts).
 */
export function MyachLazy() {
  const { yakor, Scena } = useLenivayaScena(zagruzit);

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
