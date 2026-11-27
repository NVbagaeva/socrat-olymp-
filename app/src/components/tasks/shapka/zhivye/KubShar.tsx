'use client';

import { useId } from 'react';
import { blok } from '@/lib/stereo/telo';
import { ZhivoyKoren } from './obshchee';
import type { ZhivoyProps } from './tip';
import { risovatTelo, useVrashchenie } from './tri';

const kub = blok([-1, -1, -1], [2, 2, 2]);

export default function KubShar({ label, tiho, avtofokus }: ZhivoyProps) {
  const id = useId();
  const vr = useVrashchenie({ azimut: 38, vysota: 27 }, tiho);
  const radius = 64;
  const chasti = risovatTelo(kub, vr.b, radius, [130, 130]);

  return (
    <ZhivoyKoren
      label={label}
      avtofokus={avtofokus}
      className="zhv--3d"
      naStrelku={vr.naStrelku}
      {...vr.pointer}
    >
      <svg viewBox="0 0 260 260" aria-hidden="true">
        <defs>
          <radialGradient id={id} cx="35%" cy="28%" r="75%">
            <stop offset="0%" stopColor="#fff" />
            <stop offset="25%" stopColor="#deefff" />
            <stop offset="65%" stopColor="#88baf0" />
            <stop offset="90%" stopColor="#416aa6" />
            <stop offset="100%" stopColor="#dbeaff" />
          </radialGradient>
          <linearGradient id={id + '-edge'} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#214c9d" />
            <stop offset="54%" stopColor="#5089da" />
            <stop offset="100%" stopColor="#ed984e" />
          </linearGradient>
        </defs>
        <path d={chasti.skrytye} fill="none" stroke="#88a9d7" strokeWidth="2.5" />
        <circle cx="130" cy="130" r={radius} fill={`url(#${id})`} />
        {chasti.grani.map((g) => (
          <path key={g.i} d={g.d} fill={g.n[2] > 0.5 ? '#ffe0b5' : '#83b5f4'} opacity="0.16" />
        ))}
        <path
          d={chasti.vidimye}
          fill="none"
          stroke={`url(#${id}-edge)`}
          strokeWidth="4"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </ZhivoyKoren>
  );
}
