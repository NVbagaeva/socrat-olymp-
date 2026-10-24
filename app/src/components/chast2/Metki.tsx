'use client';

import type { MarkItem, MarkLayer } from '@/lib/raboty/types';

/** Цвета пометок учителя: красная ручка, зелёная галочка, красный крестик. */
export const METKI_CVET = {
  pen: '#dc2626',
  ok: '#16a34a',
  no: '#dc2626',
  text: '#dc2626',
} as const;

/**
 * Слой пометок поверх фото: SVG в долях сторон (0…1), растягивается по
 * картинке. Оригинал фото не меняется — пометки хранятся отдельно.
 */
export function MetkiSloy({
  layer,
  width,
  height,
}: {
  layer: MarkLayer | undefined;
  width: number;
  height: number;
}) {
  const items = layer?.items ?? [];
  const k = Math.max(width, height) / 1000;
  return (
    <svg
      className="c2-metki"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {items.map((m, i) => (
        <Metka key={i} m={m} w={width} h={height} k={k} />
      ))}
    </svg>
  );
}

function Metka({ m, w, h, k }: { m: MarkItem; w: number; h: number; k: number }) {
  switch (m.t) {
    case 'pen':
      return (
        <polyline
          points={m.pts.map(([x, y]) => `${x * w},${y * h}`).join(' ')}
          fill="none"
          stroke={METKI_CVET.pen}
          strokeWidth={4 * k}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    case 'ok': {
      const x = m.x * w;
      const y = m.y * h;
      const s = 22 * k;
      return (
        <polyline
          points={`${x - s},${y} ${x - s / 3},${y + s * 0.7} ${x + s},${y - s * 0.8}`}
          fill="none"
          stroke={METKI_CVET.ok}
          strokeWidth={6 * k}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    }
    case 'no': {
      const x = m.x * w;
      const y = m.y * h;
      const s = 18 * k;
      return (
        <path
          d={`M${x - s} ${y - s}L${x + s} ${y + s}M${x + s} ${y - s}L${x - s} ${y + s}`}
          stroke={METKI_CVET.no}
          strokeWidth={6 * k}
          strokeLinecap="round"
        />
      );
    }
    case 'text':
      return (
        <text
          x={m.x * w}
          y={m.y * h}
          fill={METKI_CVET.text}
          fontSize={34 * k}
          fontWeight={700}
          fontFamily="system-ui, sans-serif"
          paintOrder="stroke"
          stroke="#fff"
          strokeWidth={6 * k}
        >
          {m.s}
        </text>
      );
  }
}
