/**
 * Значки заданий на островах «Карты ЕГЭ» — тонкие линии, как в макете.
 * Ключ — номер хранения раздела (content/struktura.js).
 * Рисуются в квадрате 24 × 24 с центром в (0, 0): остров ставит значок
 * сдвигом и масштабом. Цвет — currentColor.
 */

import type { ReactNode } from 'react';

const LINIYA = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

const TEKST = {
  fill: 'currentColor',
  stroke: 'none',
  fontStyle: 'italic',
  fontFamily: 'var(--font-serif), Georgia, serif',
  textAnchor: 'middle',
} as const;

const treugolnik = <path {...LINIYA} d="M-10 8 L3 -9 L10 8 Z" />;

const kub = (
  <g {...LINIYA}>
    <path d="M-9 -4 L1 -8 L10 -4 L0 0 Z" />
    <path d="M-9 -4 V6 L0 10 L10 6 V-4" />
    <path d="M0 0 V10" />
  </g>
);

const iks = (
  <text {...TEKST} fontSize={17} y={6}>
    x
    <tspan fontSize={10} dy={-7}>
      2
    </tspan>
  </text>
);

const ZNACHKI: Record<number, ReactNode> = {
  1: treugolnik,
  2: (
    <g {...LINIYA}>
      <path d="M-8 8 L8 -8" />
      <path d="M1 -8 H8 V-1" />
    </g>
  ),
  3: kub,
  4: (
    <g {...LINIYA}>
      <rect x={-9} y={-9} width={18} height={18} rx={4} />
      <circle cx={-4} cy={-4} r={0.9} />
      <circle cx={4} cy={-4} r={0.9} />
      <circle cx={0} cy={0} r={0.9} />
      <circle cx={-4} cy={4} r={0.9} />
      <circle cx={4} cy={4} r={0.9} />
    </g>
  ),
  5: (
    <g {...LINIYA}>
      <path d="M0 -10 L9 -5 V5 L0 10 L-9 5 V-5 Z" />
      <circle cx={-3} cy={-2} r={0.9} />
      <circle cx={3} cy={-2} r={0.9} />
      <circle cx={0} cy={3} r={0.9} />
      <circle cx={-4} cy={4} r={0.9} />
      <circle cx={4} cy={4} r={0.9} />
    </g>
  ),
  6: (
    <g {...LINIYA}>
      <path d="M-8 9 V2" />
      <path d="M-3 9 V-3" />
      <path d="M2 9 V-9" />
      <path d="M7 9 V-5" />
    </g>
  ),
  7: iks,
  8: (
    <g {...LINIYA}>
      <rect x={-8} y={-10} width={16} height={20} rx={3} />
      <path d="M-4 -5 H4" />
      <path d="M-4 0 H-3 M0 0 H1 M4 0 H4.5 M-4 5 H-3 M0 5 H1 M4 5 H4.5" />
    </g>
  ),
  9: (
    <text {...TEKST} fontSize={16} y={5}>
      f′(x)
    </text>
  ),
  10: <path {...LINIYA} d="M-11 0 C-7 -11 -3 -11 0 0 S7 11 11 0" />,
  11: (
    <g {...LINIYA}>
      <rect x={-8} y={-10} width={16} height={20} rx={3} />
      <path d="M-4 -4 H4 M-4 0 H4 M-4 4 H1" />
    </g>
  ),
  12: (
    <g {...LINIYA}>
      <path d="M-9 -10 V9 H10" />
      <path d="M-9 6 C-3 6 -2 -8 2 -8 S6 2 10 -4" />
    </g>
  ),
  13: (
    <g {...LINIYA}>
      <ellipse cx={0} cy={-6} rx={8} ry={3.2} />
      <path d="M-8 -6 V6 C-8 7.8 -4.4 9.2 0 9.2 S8 7.8 8 6 V-6" />
      <path d="M-8 -2 C-8 -0.2 -4.4 1.2 0 1.2 S8 -0.2 8 -2" />
      <path d="M-8 2 C-8 3.8 -4.4 5.2 0 5.2 S8 3.8 8 2" />
    </g>
  ),
  14: iks,
  15: kub,
  16: (
    <g {...LINIYA}>
      <path d="M8 -9 L-7 -3 L8 3" />
      <path d="M-7 9 H8" />
    </g>
  ),
  17: (
    <g {...LINIYA}>
      <path d="M-10 7 L-3 0 L2 4 L10 -6" />
      <path d="M4 -7 H10 V-1" />
    </g>
  ),
  18: treugolnik,
  19: (
    <g {...LINIYA}>
      <path d="M-10 -5 H10 M-10 5 H10" />
      <circle cx={4} cy={-5} r={2.6} fill="var(--karta-led, #fff)" />
      <circle cx={-4} cy={5} r={2.6} fill="var(--karta-led, #fff)" />
    </g>
  ),
  20: (
    <g {...LINIYA}>
      <path d="M-6 -9 H6 V-3 A6 6 0 0 1 -6 -3 Z" />
      <path d="M-6 -7 H-9.5 A3.5 3.5 0 0 0 -6 -2 M6 -7 H9.5 A3.5 3.5 0 0 1 6 -2" />
      <path d="M0 3 V7 M-5 9.5 H5" />
    </g>
  ),
  /* Новый №12 (номер хранения 21): кривая с отмеченной вершиной — наибольшим значением. */
  21: (
    <g {...LINIYA}>
      <path d="M-11 8 C-6 8 -4 -6 0 -6 S6 4 11 2" />
      <path d="M-11 -6 H-3" strokeDasharray="2 2.4" />
      <circle cx={0} cy={-6} r={2.4} fill="currentColor" />
    </g>
  ),
};

/** Значок задания; children — на случай номера без значка. */
export function ZnachokZadaniya({ no }: { no: number }) {
  return <>{ZNACHKI[no] ?? null}</>;
}
