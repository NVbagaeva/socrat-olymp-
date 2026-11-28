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
            <stop offset="0%" stopColor="var(--chertezh-blik)" />
            <stop offset="25%" stopColor="var(--chertezh-goluboy-svet)" />
            <stop offset="65%" stopColor="var(--chertezh-setka)" />
            <stop offset="90%" stopColor="var(--chertezh-liniya)" />
            <stop offset="100%" stopColor="var(--chertezh-zalivka-siniy)" />
          </radialGradient>
          <linearGradient id={id + '-edge'} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--chertezh-liniya)" />
            <stop offset="54%" stopColor="var(--chertezh-siniy)" />
            <stop offset="100%" stopColor="var(--chertezh-akcent)" />
          </linearGradient>
        </defs>
        <path d={chasti.skrytye} fill="none" stroke="var(--chertezh-setka)" strokeWidth="2.5" />
        <circle cx="130" cy="130" r={radius} fill={`url(#${id})`} />
        {chasti.grani.map((g) => (
          <path key={g.i} d={g.d} fill={g.n[2] > 0.5 ? 'var(--chertezh-akcent-svet)' : 'var(--chertezh-goluboy)'} opacity="0.16" />
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
