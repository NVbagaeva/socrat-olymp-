import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { Badge, type BadgeTone } from './Badge';
import { ProgressBar } from './ProgressBar';

export interface HomeworkCardProps {
  title: ReactNode;
  /** Срок сдачи словами: «До 8 сентября, 14:00». */
  due: ReactNode;
  priority?: ReactNode;
  priorityTone?: BadgeTone;
  /** Готово заданий из общего числа. */
  done: number;
  total: number;
  className?: string;
}

export function HomeworkCard({
  title,
  due,
  priority,
  priorityTone = 'warning',
  done,
  total,
  className,
}: HomeworkCardProps) {
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <article className={clsx('card hw-card', className)}>
      <div className="hw-card__head">
        <h4 className="hw-card__title">{title}</h4>
        {priority !== undefined ? <Badge tone={priorityTone}>{priority}</Badge> : null}
      </div>
      <p className="t-caption muted hw-card__due">{due}</p>
      <ProgressBar value={percent} label={`Выполнено ${done} из ${total} заданий`} />
      <p className="t-caption dim hw-card__progress">
        {percent}% · {done} из {total} заданий
      </p>
    </article>
  );
}
