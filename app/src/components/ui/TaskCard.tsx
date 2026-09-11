import { clsx } from 'clsx';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import { Badge, type BadgeTone } from './Badge';

export type TaskStatusTone = 'neutral' | 'solved' | 'failed';

export interface TaskCardProps extends Omit<ComponentPropsWithRef<'button'>, 'children' | 'title'> {
  /** Номер задания в экзамене. */
  number: ReactNode;
  title: ReactNode;
  /** Уровень сложности словом: «Базовое», «Среднее», «Сложное». */
  difficulty?: ReactNode;
  difficultyTone?: BadgeTone;
  status?: ReactNode;
  statusTone?: TaskStatusTone;
}

const STATUS: Record<TaskStatusTone, string | null> = {
  neutral: 'dim',
  solved: 'task-card__status--solved',
  failed: 'task-card__status--failed',
};

export function TaskCard({
  number,
  title,
  difficulty,
  difficultyTone = 'neutral',
  status,
  statusTone = 'neutral',
  className,
  ...rest
}: TaskCardProps) {
  return (
    <button type="button" className={clsx('task-card', className)} {...rest}>
      <span className="task-card__no" aria-hidden="true">
        {number}
      </span>
      <span className="task-card__body">
        <span className="task-card__title">
          <span className="sr-only">Задание {number}. </span>
          {title}
        </span>
        <span className="task-card__meta">
          {difficulty !== undefined ? <Badge tone={difficultyTone}>{difficulty}</Badge> : null}
          {status !== undefined ? (
            <span className={clsx('t-caption', STATUS[statusTone])}>{status}</span>
          ) : null}
        </span>
      </span>
    </button>
  );
}
