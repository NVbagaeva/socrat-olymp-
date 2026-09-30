/**
 * Стрелка в кружке: значок текстовой карточки «Куда это ведёт».
 *
 * Силуэтный, как книга у определения: заливка currentColor, цвет
 * задаёт место вставки.
 */
export function ForwardIcon() {
  return (
    <svg
      className="qth-card__icon"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="none"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm.7 5.3 3.9 3.9a1.1 1.1 0 0 1 0 1.6l-3.9 3.9a1.1 1.1 0 0 1-1.6-1.6l2-2H8a1.1 1.1 0 0 1 0-2.2h5.1l-2-2a1.1 1.1 0 0 1 1.6-1.6z" />
    </svg>
  );
}
