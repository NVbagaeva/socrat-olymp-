/**
 * Значки вердикта: галочка и крестик.
 *
 * Цвет берётся от текста (currentColor), поэтому зелёный и красный
 * задаются один раз в стилях вердикта, а не здесь.
 */

/** Галочка в кружке: «функция». */
export function CheckIcon() {
  return (
    <svg className="verdict__ico" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm5 7.4-6.2 6.2a1 1 0 0 1-1.4 0L7 13.2a1 1 0 1 1 1.4-1.4l1.7 1.7 5.5-5.5A1 1 0 0 1 17 9.4z" />
    </svg>
  );
}

/** Косой крест: «не функция». Без кружка, как на макете. */
export function CrossIcon() {
  return (
    <svg className="verdict__ico" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6.4 4.6 12 10.2l5.6-5.6a1.3 1.3 0 0 1 1.8 1.8L13.8 12l5.6 5.6a1.3 1.3 0 0 1-1.8 1.8L12 13.8l-5.6 5.6a1.3 1.3 0 0 1-1.8-1.8L10.2 12 4.6 6.4a1.3 1.3 0 0 1 1.8-1.8z" />
    </svg>
  );
}
