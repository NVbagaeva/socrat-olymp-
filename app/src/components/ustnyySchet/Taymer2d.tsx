'use client';

import { clsx } from 'clsx';
import { taymerKadr, type TaymerKadr } from '@/lib/ustnyySchet/taymer';
import { TaymerCifry } from './TaymerCifry';

export interface TaymerProps {
  /** Активное время с начала, мс. */
  ms: number;
  /** Лимит (на время) — кольцо тает; null — секундомер, кольцо за минуту. */
  limitMs: number | null;
  naPauze?: boolean;
}

const R = 52;
const DLINA = 2 * Math.PI * R;

/** Кольцо на SVG: синее стекло с тёплым свечением. */
export function KolcoSvg({ k }: { k: TaymerKadr }) {
  return (
    <svg className="us-taymer__svg" viewBox="0 0 120 120" aria-hidden="true">
      <defs>
        <linearGradient id="us-steklo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--us-glass-1)" />
          <stop offset="1" stopColor="var(--us-glass-2)" />
        </linearGradient>
        <radialGradient id="us-teplo" cx="0.7" cy="0.2" r="0.9">
          <stop offset="0" stopColor="var(--us-warm)" stopOpacity="0.55" />
          <stop offset="1" stopColor="var(--us-warm)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="58" fill="url(#us-teplo)" className="us-taymer__glow" />
      <circle cx="60" cy="60" r={R} className="us-taymer__track" />
      <g transform={`rotate(${-90 + k.oborot} 60 60)`}>
        <circle
          cx="60"
          cy="60"
          r={R}
          className="us-taymer__ring"
          stroke="url(#us-steklo)"
          strokeDasharray={`${DLINA * k.dolya} ${DLINA}`}
        />
      </g>
    </svg>
  );
}

/**
 * Таймер на SVG — запасной вид 3D-таймера: без WebGL, на слабых
 * устройствах и при prefers-reduced-motion. Что рисовать —
 * lib/ustnyySchet/taymer.ts, общее с 3D-кольцом.
 */
export function Taymer2d({ ms, limitMs, naPauze = false }: TaymerProps) {
  const k = taymerKadr(ms, limitMs);
  return (
    <div
      className={clsx(
        'us-taymer',
        k.poslednie && 'is-poslednie',
        k.nol && 'is-nol',
        naPauze && 'is-pauza',
      )}
      data-taymer="2d"
      data-ms={Math.round(k.vniz ? k.ostalos : ms)}
    >
      <KolcoSvg k={k} />
      <TaymerCifry k={k} />
    </div>
  );
}
