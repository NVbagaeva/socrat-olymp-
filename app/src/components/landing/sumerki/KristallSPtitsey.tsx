'use client';

import { clsx } from 'clsx';
import { useCallback, useState } from 'react';
import { Kristall } from '../kristall/Kristall';
import { Zherdochka } from '../Zherdochka';

/**
 * Кристалл тёмной сцены и попугай на его верхней грани.
 *
 * Попугай — тот же персонаж с жёрдочки у заголовка (Zherdochka): дыхание
 * и жесты те же. Пока фигура в исходном ракурсе, птица стоит на плоской
 * верхней грани — жёрдочки не видно. Фигуру начали крутить — птица
 * вспархивает и садится на стеклянную жёрдочку, которая проявляется на
 * «полу» слева. Фигура вернулась на место (Kristall, vozvrat) — птица
 * перелетает обратно. При prefers-reduced-motion полёта нет: птица
 * гаснет и проявляется на новом месте (sumerki.css).
 *
 * Сидеть на грани можно только в исходном ракурсе: там рендер и модель
 * совпадают, и грань стоит в одном и том же месте кадра. Поэтому птица
 * и улетает, пока фигуру крутят.
 */
export function KristallSPtitsey({
  className,
  podskazka,
}: {
  className?: string;
  podskazka: string;
}) {
  const [mesto, setMesto] = useState<'kristall' | 'pol'>('kristall');
  /* Полёт — отдельным атрибутом: он нужен только для анимации перелёта,
     а не при первой отрисовке. */
  const [letit, setLetit] = useState(false);
  const onKrutyat = useCallback((krutyat: boolean) => {
    setLetit(true);
    setMesto(krutyat ? 'pol' : 'kristall');
  }, []);

  return (
    <div className={clsx('sm-kr', className)}>
      {/* Светлый ореол за фигурой — sumerki.css. Подложка на полу — та,
          что вшита в рендер. */}
      <span className="sm-kr__oreol" aria-hidden="true" />
      <Kristall
        temnyyFon
        vozvrat
        onKrutyat={onKrutyat}
        hint={podskazka}
        sizes="(max-width: 639.98px) 220px, 356px"
      />
      <div
        className="sm-ptica"
        data-mesto={mesto}
        data-letit={letit ? '' : undefined}
        aria-hidden="true"
        onAnimationEnd={(e) => {
          if (e.target === e.currentTarget) setLetit(false);
        }}
      >
        <span className="sm-ptica__kryl">
          <Zherdochka podgon={false} />
        </span>
      </div>
    </div>
  );
}
