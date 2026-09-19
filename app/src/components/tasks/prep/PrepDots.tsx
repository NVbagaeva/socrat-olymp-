import { clsx } from 'clsx';

/**
 * Ряд кружков-номеров: сколько задач в наборе, столько и кружков.
 *
 * Цвет кружка говорит, что с задачей стало: зелёный — решена,
 * красный — отвечен неверно, янтарный — разобрано решение, серый
 * с точкой — пропущена, пустой — не открывалась. Текущая задача
 * залита.
 *
 * Ряд бывает двух видов. С `onPick` это навигация: кружок — кнопка,
 * по ней переходят к задаче. Без `onPick` — просто указатель хода
 * (подход тренажёра идёт по порядку, прыгать некуда), и от озвучки
 * он скрыт: номер текущей задачи проговаривает строка над рядом.
 *
 * Разметка и стили — те же, что у подготовки задания №12
 * (`prep.css`, классы `ptask__dots` и `pdot`).
 */

/** Что стало с задачей. null — не открывалась. */
export type PrepDotState = 'right' | 'wrong' | 'revealed' | 'skipped' | null;

export interface PrepDot {
  /** Ключ списка: идентификатор задачи. */
  id: string;
  /** Что написано в кружке. */
  no: number;
  state: PrepDotState;
}

export interface PrepDotsProps {
  items: readonly PrepDot[];
  /** Номер открытой задачи в наборе, с нуля. */
  current: number;
  /** Переход к задаче. Нет обработчика — ряд только показывает ход. */
  onPick?: (index: number) => void;
  /** Название ряда для озвучки. Нужно там, где кружки нажимаются. */
  label?: string;
}

/* Что дочитывает озвучка после номера. Цвет читающему экран не виден,
   поэтому состояние проговаривается словами. */
const SOSTOYANIE: Record<Exclude<PrepDotState, null>, string> = {
  right: ' — решено верно',
  wrong: ' — решено неверно',
  revealed: ' — разобрано решение',
  skipped: ' — пропущено',
};

export function PrepDots({ items, current, onPick, label }: PrepDotsProps) {
  if (onPick === undefined) {
    return (
      <ol className="ptask__dots" aria-hidden="true">
        {items.map((item, i) => (
          <li
            key={item.id}
            className={clsx(
              'pdot',
              'pdot--flat',
              item.state !== null && `is-${item.state}`,
              i === current && 'is-current',
            )}
          >
            {item.no}
          </li>
        ))}
      </ol>
    );
  }

  return (
    <ol className="ptask__dots" aria-label={label}>
      {items.map((item, i) => (
        <li key={item.id}>
          <button
            type="button"
            className={clsx(
              'pdot',
              item.state !== null && `is-${item.state}`,
              i === current && 'is-current',
            )}
            aria-current={i === current ? 'true' : undefined}
            onClick={() => onPick(i)}
          >
            {item.no}
            <span className="sr-only">{item.state === null ? null : SOSTOYANIE[item.state]}</span>
          </button>
        </li>
      ))}
    </ol>
  );
}
