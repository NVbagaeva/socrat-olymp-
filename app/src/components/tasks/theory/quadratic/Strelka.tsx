/**
 * Рисованная стрелка от подписи к тому, что она подписывает.
 *
 * Дуга и остриё приходят путями: у каждой подписи своя кривая, а
 * холст один — 120 × 120, и стрелка тянется по нему целиком. Цвет и
 * толщина линии — в стилях, поэтому здесь ни того, ни другого нет.
 */
export function Strelka({
  d,
  ostriyo,
  className,
}: {
  d: string;
  ostriyo: string;
  className?: string;
}) {
  return (
    <svg
      className={className === undefined ? 'strelka' : `strelka ${className}`}
      viewBox="0 0 120 120"
      aria-hidden="true"
      focusable="false"
    >
      <path d={d} />
      <path d={ostriyo} />
    </svg>
  );
}
