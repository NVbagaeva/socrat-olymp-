import { clsx } from 'clsx';
import { renderPlan } from '@/lib/planimetriya/render';
import type { Optsii, Scena } from '@/lib/planimetriya/types';

export interface ChertezhProps {
  /** Сцена движка: точки, построения, элементы по слоям. */
  scena: Scena;
  /** Режим (ученик, подсказка N, учитель), вариант, числа, размер. */
  optsii?: Optsii;
  className?: string;
}

/**
 * Планиметрический чертёж задания №1.
 *
 * Рисунок строится движком lib/planimetriya из сцены: своих SVG в
 * проекте нет. Разметка приходит строкой и вставляется как есть —
 * тот же приём, что у Risunok (№2) и Chart (№12). Доступность —
 * role="img" и aria-label из optsii.alt.
 */
export function Chertezh({ scena, optsii, className }: ChertezhProps) {
  const svg = renderPlan(scena, optsii);
  return <span className={clsx('pl-wrap', className)} dangerouslySetInnerHTML={{ __html: svg }} />;
}
