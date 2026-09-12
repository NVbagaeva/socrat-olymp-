import { clsx } from 'clsx';
import Link from 'next/link';
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
  /** Решённость задачи учеником: «Решено», «Ошибка», «Не решено». */
  status?: ReactNode;
  statusTone?: TaskStatusTone;
  /** Адрес раздела. Задан — карточка становится ссылкой целиком. */
  href?: string;
  /** Раздел ещё не открыт: карточка неинтерактивна и помечена бейджем. */
  comingSoon?: boolean;
  /** Миниатюра раздела. Оформление — за страницей, здесь только место. */
  illustration?: ReactNode;
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
  comingSoon = false,
  illustration,
  className,
  ...rest
}: TaskCardProps) {
  /* Внутренняя разметка одна на все три варианта: меняется только
     внешний тег, поэтому вид и классы совпадают в точности.
     Интерактивных элементов внутри нет — одни span, — поэтому
     обёртка ссылкой не создаёт вложенных элементов управления. */
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
          {comingSoon ? <Badge>Скоро</Badge> : null}
          {difficulty !== undefined ? <Badge tone={difficultyTone}>{difficulty}</Badge> : null}
          {status !== undefined ? (
            <span className={clsx('t-caption', STATUS[statusTone])}>{status}</span>
          ) : null}
        </span>
      </span>
      {illustration !== undefined ? (
        <span className="task-card__ill" aria-hidden="true">
          {illustration}
        </span>
      ) : null}
      {/* Стрелка открытого раздела. Это span, а не кнопка: карточка уже
          ссылка, вложенный элемент управления сделал бы разметку
          невалидной и сломал бы обход с клавиатуры. */}
      {href !== undefined ? (
        <span className="task-card__go" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <path d="M5 12h13M12 6l6 6-6 6" />
          </svg>
        </span>
      ) : null}
    </>
  );

  /* Раздел не открыт: ни ссылки, ни кнопки, ни обработчика. Обычный
     span не попадает в обход по Tab и не обещает кликабельности,
     а aria-disabled сообщает состояние скринридеру. */
  if (comingSoon) {
    return (
      <span className={clsx('task-card', 'task-card--soon', className)} aria-disabled="true">
        {body}
      </span>
    );
  }

  /* Раздел открыт: ссылка целиком, а не только заголовок. */
  if (href !== undefined) {
    return (
      <Link className={clsx('task-card', className)} href={href}>
        {body}
      </Link>
    );
  }

  /* Ни один из новых пропов не передан — поведение прежнее. */
  return (
    <button type="button" className={clsx('task-card', className)} {...rest}>
      {body}
    </button>
  );
}
