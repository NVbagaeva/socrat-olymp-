import { clsx } from 'clsx';
import { useMemo } from 'react';
import { renderFigura, type RezhimRisunka } from '@/lib/proizvodnaya/render';
import type { Figura } from '@/lib/proizvodnaya/types';

export interface Risunok9Props {
  figura: Figura;
  /**
   * 'student' — условие, без построений; 'hint' — подсказка, показаны
   * построения с шагом не больше `shag`; 'teacher' — все построения.
   */
  rezhim: RezhimRisunka;
  /** Шаг подсказки: растёт по мере верных ответов (режим 'hint'). */
  shag?: number;
  className?: string;
}

/**
 * Рисунок задания №9 на странице.
 *
 * Строится движком lib/proizvodnaya/render из данных задачи: своих
 * SVG нет. Разметка приходит строкой своего источника и вставляется
 * как есть — тот же приём, что у Risunok №2. Доступность внутри SVG:
 * role="img" и aria-label из поля alt фигуры.
 */
export function Risunok9({ figura, rezhim, shag, className }: Risunok9Props) {
  const svg = useMemo(
    () => renderFigura(figura, shag === undefined ? { rezhim } : { rezhim, shag }),
    [figura, rezhim, shag],
  );
  return (
    <span className={clsx('z9-risunok', className)} dangerouslySetInnerHTML={{ __html: svg }} />
  );
}
