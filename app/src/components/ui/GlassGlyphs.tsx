import { useId } from 'react';

/**
 * Глифы для стеклянного кружка GlassBadge.
 *
 * Рисуются в холсте 160×160 — том же, что и стекло, поэтому слои
 * совмещаются один в один и координаты можно брать из образца
 * design-reference/mockups/zadanie-04/glass-badge-statistika.svg
 * без пересчёта. Цвета — токены, прозрачности перенесены из образца.
 */

/** Столбики гистограммы: своя высота у каждого, общий низ на y = 98. */
const STOLBIKI = [
  { x: 60, y: 80, height: 18 },
  { x: 72, y: 58, height: 40 },
  { x: 84, y: 70, height: 28 },
  { x: 96, y: 84, height: 14 },
];

function Stolbiki() {
  return (
    <>
      {STOLBIKI.map((s) => (
        <rect key={s.x} x={s.x} y={s.y} width="5.5" height={s.height} rx="2.75" />
      ))}
    </>
  );
}

/** Гистограмма: четыре столбика разной высоты на основании. */
export function HistogramGlyph() {
  const id = useId();
  const barId = `${id}-bar`;
  const blurId = `${id}-blur`;

  return (
    <svg className="glass-glyph" viewBox="0 0 160 160" aria-hidden="true" focusable="false">
      <defs>
        {/* Столбики: белые, к основанию уходят в голубой. */}
        <linearGradient id={barId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" className="glass-glyph__stop-top" stopOpacity="0.95" />
          <stop offset="100%" className="glass-glyph__stop-bottom" stopOpacity="0.7" />
        </linearGradient>
        <filter id={blurId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.4" />
        </filter>
      </defs>

      {/* Лёгкая тень под глифом: она и сажает столбики на стекло. */}
      <g
        className="glass-glyph__shadow"
        opacity="0.25"
        filter={`url(#${blurId})`}
        transform="translate(1,2)"
      >
        <Stolbiki />
      </g>
      <g fill={`url(#${barId})`}>
        <Stolbiki />
      </g>
      <rect className="glass-glyph__base" x="52" y="100" width="58" height="4" rx="2" />
    </svg>
  );
}
