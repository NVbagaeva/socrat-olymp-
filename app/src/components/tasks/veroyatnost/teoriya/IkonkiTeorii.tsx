/**
 * Значки вкладки «Теория» задания №4, которых нет в общих наборах.
 *
 * Рисуются теми же средствами, что и остальные значки проекта:
 * инлайновый SVG, поле 24×24, обводка currentColor, заливки нет.
 * Цвет и размер задаёт место вставки.
 *
 * Лампочка, галочка и восклицательный знак здесь не повторяются: они
 * взяты готовыми из общих наборов.
 */

/** Закладка: значок плашки «Запомни». */
export function ZakladkaIcon() {
  return (
    <svg
      className="z4-ico"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M6.5 4h11a1 1 0 0 1 1 1v15l-6.5-4.2L5.5 20V5a1 1 0 0 1 1-1z" />
    </svg>
  );
}

/** Два звена цепи: значок карточки «Независимые события». */
export function ZvenoIcon() {
  return (
    <svg
      className="z4-ico"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M9.6 14.4 14.4 9.6" />
      <path d="M13 6.8 14.9 5a3.6 3.6 0 0 1 5.1 5.1l-1.8 1.8" />
      <path d="M11 17.2 9.1 19A3.6 3.6 0 0 1 4 13.9l1.8-1.8" />
    </svg>
  );
}

/** Два пересекающихся круга: значок карточки «Совместные события». */
export function KrugiIcon() {
  return (
    <svg
      className="z4-ico"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="9.2" cy="12" r="5.8" />
      <circle cx="14.8" cy="12" r="5.8" />
    </svg>
  );
}
