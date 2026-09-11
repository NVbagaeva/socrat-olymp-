import { clsx } from 'clsx';
import type { ReactNode } from 'react';

export interface Recommendation {
  id: string;
  title: ReactNode;
  /** Причина обязательна: рекомендация без объяснения запрещена. */
  why: ReactNode;
  action?: ReactNode;
  /** Первая рекомендация выделяется насыщенной точкой. */
  primary?: boolean;
}

export interface RecommendationCardProps {
  title?: ReactNode;
  action?: ReactNode;
  items: Recommendation[];
  className?: string;
}

export function RecommendationCard({
  title = 'Что делать дальше',
  action,
  items,
  className,
}: RecommendationCardProps) {
  return (
    <section
      className={clsx('card', className)}
      aria-label={typeof title === 'string' ? title : undefined}
    >
      <div className="card__head">
        <span className="card__title">{title}</span>
        {action}
      </div>
      <ul>
        {items.map((item) => (
          <li key={item.id} className="rec">
            <span
              className={clsx('rec__mark', !item.primary && 'rec__mark--soft')}
              aria-hidden="true"
            />
            <div className="rec__body">
              <div className="rec__head">
                <span className="rec__title">{item.title}</span>
                {item.action}
              </div>
              <p className="rec__why">{item.why}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
