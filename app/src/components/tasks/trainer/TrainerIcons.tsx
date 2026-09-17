import type { ReactNode } from 'react';
import type { TrainerIconId } from '@/content/trainerModes';

/* Иконки нарисованы так же, как остальные в проекте: обводка
   currentColor, заливки нет, размер задаёт разметка. */

/** Документ в строке выбора типа заданий. */
export function DocIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6M9 16h4" />
    </svg>
  );
}

/** Шеврон: вниз у закрытой строки, вверх у раскрытой. */
export function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

/* У каждого режима свой знак. Прямая с отмеченной точкой — значение
   функции; та же прямая с засечкой по оси x — аргумент; две прямые
   с общей точкой — пересечение; три штриха — смешанный режим. */
const SHAPES: Record<TrainerIconId, ReactNode> = {
  value: (
    <>
      <path d="M4 18L18 6" />
      <circle cx="14" cy="10" r="1.8" />
      <path d="M14 12v6" />
    </>
  ),
  argument: (
    <>
      <path d="M4 18L18 6" />
      <circle cx="11" cy="13" r="1.8" />
      <path d="M4 13h7" />
    </>
  ),
  intersection: (
    <>
      <path d="M4 16L18 6" />
      <path d="M4 6l14 10" />
      <circle cx="11" cy="11" r="1.8" />
    </>
  ),
  mixed: (
    <>
      <path d="M4 17L10 9" />
      <path d="M9 17l5-9" />
      <path d="M14 17l6-10" />
    </>
  ),
};

export function ModeIcon({ id }: { id: TrainerIconId }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {SHAPES[id]}
    </svg>
  );
}
