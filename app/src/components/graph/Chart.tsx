import { clsx } from 'clsx';
import { renderGraph } from '@/lib/graph/renderer.js';

export interface ChartProps {
  /** Сцена движка: окно, сетка, оси, кривые, точки. */
  scene: unknown;
  className?: string;
}

/**
 * Чертёж движка graph/ на странице.
 *
 * Своего SVG в проекте нет и не должно быть: любой чертёж собирает
 * renderGraph по описанию сцены. Разметка приходит строкой, поэтому
 * вставляется как есть — источник свой, из данных страницы.
 *
 * Доступность лежит внутри SVG: движок сам ставит role="img" и
 * aria-label по полю alt сцены, а без alt помечает чертёж скрытым.
 */
export function Chart({ scene, className }: ChartProps) {
  const svg = renderGraph(scene) as string;
  return (
    <span className={clsx('chart', className)} dangerouslySetInnerHTML={{ __html: svg }} />
  );
}
