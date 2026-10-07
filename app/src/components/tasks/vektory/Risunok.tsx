import { clsx } from 'clsx';
import { renderVectorPlane } from '@/lib/vektory/render';
import type { Risunok as RisunokConfig } from '@/lib/vektory/types';

export interface RisunokProps {
  /** Конфигурация движка рисунков: векторы, окно, режимы. */
  config: RisunokConfig;
  className?: string;
}

/**
 * Рисунок задания №2 на странице.
 *
 * Рисунок строится движком lib/vektory из конфигурации: своих SVG
 * в проекте нет. Разметка приходит строкой и вставляется как есть —
 * источник свой, из данных страницы. Тот же приём, что у Chart
 * (графики) и Solid (стереометрия). Доступность внутри SVG:
 * role="img" и aria-label из поля alt.
 */
export function Risunok({ config, className }: RisunokProps) {
  const svg = renderVectorPlane(config);
  return <span className={clsx('vp-wrap', className)} dangerouslySetInnerHTML={{ __html: svg }} />;
}
