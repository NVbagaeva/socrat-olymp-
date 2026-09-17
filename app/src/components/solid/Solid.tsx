import { clsx } from 'clsx';
import { type Model, renderSolid } from '@/lib/solid';

export interface SolidProps {
  /** Модель движка solid/: тела, пометки, описание. */
  model: Model;
  className?: string;
}

/**
 * Стереометрический чертёж на странице.
 *
 * Чертёж строится движком из модели в пространстве: своих SVG в проекте
 * нет. Разметка приходит строкой и вставляется как есть — источник свой,
 * из данных страницы. Доступность внутри SVG: role="img" и aria-label
 * по описанию модели.
 */
export function Solid({ model, className }: SolidProps) {
  const svg = renderSolid(model);
  return (
    <span className={clsx('solid-wrap', className)} dangerouslySetInnerHTML={{ __html: svg }} />
  );
}
