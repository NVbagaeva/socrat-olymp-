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

/** Канцелярская кнопка: значок блока «Не путай!». */
export function PinIcon() {
  return (
    <svg className="nofn-note__ico" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M14.4 2.3a1.6 1.6 0 0 1 2.3 0l5 5a1.6 1.6 0 0 1-1.5 2.7l-2.2-.4-3.4 3.4.5 2.2a2.4 2.4 0 0 1-.6 2.2l-.9.9a1.2 1.2 0 0 1-1.7 0L8 14.8l-4.2 4.2a1 1 0 0 1-1.4-1.4L6.6 13.4 2.5 9.3a1.2 1.2 0 0 1 0-1.7l.9-.9a2.4 2.4 0 0 1 2.2-.6l2.2.5 3.4-3.4-.4-2.2a1.6 1.6 0 0 1 .4-1.4z" />
    </svg>
  );
}

/** Треугольник с восклицательным знаком: значок блока «Запомни». */
export function WarnIcon() {
  return (
    <svg className="nofn-note__ico" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.8c.6 0 1.2.3 1.5.9l8.2 14.6a1.7 1.7 0 0 1-1.5 2.6H3.8a1.7 1.7 0 0 1-1.5-2.6l8.2-14.6c.3-.6.9-.9 1.5-.9zm0 4.9a1.1 1.1 0 0 0-1.1 1.2l.3 4.6a.8.8 0 0 0 1.6 0l.3-4.6A1.1 1.1 0 0 0 12 7.7zm0 8.1a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4z" />
    </svg>
  );
}
