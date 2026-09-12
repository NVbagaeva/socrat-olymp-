import { clsx } from 'clsx';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import { Badge, type BadgeTone } from './Badge';

export type TaskStatusTone = 'neutral' | 'solved' | 'failed';

interface TaskCardOwnProps {
  /** Номер задания в экзамене. */
  number: ReactNode;
  title: ReactNode;
  /** Уровень сложности словом: «Базовое», «Среднее», «Сложное». */
  difficulty?: ReactNode;
  difficultyTone?: BadgeTone;
  status?: ReactNode;
  statusTone?: TaskStatusTone;
  /** Адрес раздела. Задан — карточка становится ссылкой целиком. */
  href?: string;
  /** Раздел ещё не открыт: карточка не кликается и помечена бейджем. */
  soon?: boolean;
  /** Подпись бейджа неоткрытого раздела. */
  soonLabel?: ReactNode;
}

export type TaskCardProps = TaskCardOwnProps &
  Omit<ComponentPropsWithRef<'button'>, keyof TaskCardOwnProps | 'children' | 'title'>;

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
  href,
  soon = false,
  soonLabel = 'Скоро',
  className,
  ...rest
}: TaskCardProps) {
  const body = (
    <>
      <span className="task-card__no" aria-hidden="true">
        {number}
      </span>
      <span className="task-card__body">
        <span className="task-card__title">
          <span className="sr-only">Задание {number}. </span>
          {title}
        </span>
        <span className="task-card__meta">
          {soon ? <Badge>{soonLabel}</Badge> : null}
          {difficulty !== undefined ? <Badge tone={difficultyTone}>{difficulty}</Badge> : null}
          {status !== undefined ? (
            <span className={clsx('t-caption', STATUS[statusTone])}>{status}</span>
          ) : null}
        </span>
      </span>
    </>
  );

  /* Неоткрытый раздел: не ссылка и не кнопка — по нему некуда идти.
     Обычный span не попадает в обход по Tab и не читается как элемент
     управления, поэтому обещание кликабельности не возникает. */
  if (soon) {
    return (
      <span className={clsx('task-card', 'task-card--soon', className)} aria-disabled="true">
        {body}
      </span>
    );
  }

  /* Открытый раздел: ссылка целиком, а не только заголовок. */
  if (href !== undefined) {
    return (
      <a className={clsx('task-card', className)} href={href}>
        {body}
      </a>
    );
  }

  return (
    <button type="button" className={clsx('task-card', className)} {...rest}>
      {body}
    </button>
  );
}
