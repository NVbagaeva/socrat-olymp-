/**
 * Значки карточек «Возможные формулировки».
 *
 * Рисуются теми же средствами, что и значки меню: инлайновый SVG,
 * поле 24×24, обводка currentColor, заливки нет. Библиотека иконок в
 * проекте не заводится. Цвет задаёт место вставки — на карточке это
 * акцент.
 *
 * Пунктиром показан ход рассуждения: от известного к искомому.
 * Стрелка стоит там, где ответ.
 */

import type { FormulationIconId } from '@/content/sections';

/* Оси одни и те же у всех четырёх значков. */
const AXES = <path d="M4 3.5V20h16.5" />;

const PATHS: Record<FormulationIconId, React.ReactNode> = {
  /* Известен x — ищем y: точка на графике, пунктир к оси y. */
  value: (
    <>
      {AXES}
      <path d="M6.5 17.5 18 6.5" />
      <path d="M4 12.5h7" strokeDasharray="2 2.5" />
      <circle cx="12.5" cy="12.5" r="1.3" />
    </>
  ),
  /* Известен y — ищем x: та же точка, пунктир к оси x. */
  argument: (
    <>
      {AXES}
      <path d="M6.5 17.5 18 6.5" />
      <path d="M12.5 14v6" strokeDasharray="2 2.5" />
      <circle cx="12.5" cy="12.5" r="1.3" />
    </>
  ),
  /* Пересечение двух графиков, ответ — по оси x. */
  abscissa: (
    <>
      {AXES}
      <path d="M6 17.5 18.5 7.5M6 8 18.5 18" />
      <path d="M11 14.5v5.5" strokeDasharray="2 2.5" />
      <circle cx="11" cy="12.6" r="1.3" />
    </>
  ),
  /* Пересечение двух графиков, ответ — по оси y. */
  ordinate: (
    <>
      {AXES}
      <path d="M6 17.5 18.5 7.5M6 8 18.5 18" />
      <path d="M4 12.6h5.3" strokeDasharray="2 2.5" />
      <circle cx="11" cy="12.6" r="1.3" />
    </>
  ),
};

export function FormulationIcon({ name }: { name: FormulationIconId }) {
  return (
    <svg
      className="form-ico"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}
