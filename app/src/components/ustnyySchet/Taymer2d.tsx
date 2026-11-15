'use client';

import { clsx } from 'clsx';
import { mmss, OTMETKI_SEK } from '@/lib/ustnyySchet/chasy';
import { USTNYY } from '@/content/ustnyySchet';

export interface TaymerProps {
  /** Активное время с начала, мс. */
  ms: number;
  /** Лимит (на время) — кольцо тает; null — секундомер, кольцо за минуту. */
  limitMs: number | null;
  naPauze?: boolean;
}

const R = 52;
const DLINA = 2 * Math.PI * R;
const T = USTNYY.trenirovka;

/**
 * Кольцо таймера на SVG — синее стекло с тёплой подсветкой. Запасной
 * вид 3D-таймера: без WebGL, на слабых устройствах и при
 * prefers-reduced-motion. Цифры — обычный текст поверх кольца.
 *
 * Скринридер слышит остаток только на отметках 60, 30, 10 и 0 секунд,
 * а не каждую секунду.
 */
export function Taymer2d({ ms, limitMs, naPauze = false }: TaymerProps) {
  const vniz = limitMs !== null;
  const ostalos = vniz ? Math.max(0, limitMs - ms) : 0;
  const dolya = vniz ? ostalos / limitMs : (ms % 60_000) / 60_000;
  const poslednie = vniz && ostalos <= 10_000 && ostalos > 0;
  const nol = vniz && ostalos === 0;
  const cifry = mmss(vniz ? ostalos : ms);
  const oborot = vniz ? 0 : (ms / 60_000) * 36;

  /* Объявление — последняя пройденная отметка (60, 30, 10, 0 с).
     Текст меняется только на отметках, и скринридер читает только их. */
  const sek = Math.ceil(ostalos / 1000);
  const limitSek = Math.ceil((limitMs ?? 0) / 1000);
  const otmetka = vniz ? OTMETKI_SEK.filter((o) => sek <= o && o < limitSek).pop() : undefined;
  const obyavlenie =
    otmetka === undefined ? '' : otmetka === 0 ? T.vremyaVyshlo : T.ostalos(mmss(otmetka * 1000));

  return (
    <div
      className={clsx(
        'us-taymer',
        poslednie && 'is-poslednie',
        nol && 'is-nol',
        naPauze && 'is-pauza',
      )}
      data-taymer="2d"
    >
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
        <g transform={`rotate(${-90 + oborot} 60 60)`}>
          <circle
            cx="60"
            cy="60"
            r={R}
            className="us-taymer__ring"
            stroke="url(#us-steklo)"
            strokeDasharray={`${DLINA * dolya} ${DLINA}`}
          />
        </g>
      </svg>
      <div
        className="us-taymer__cifry"
        role="timer"
        aria-label={vniz ? T.ostalos(cifry) : T.proshlo(cifry)}
      >
        <span aria-hidden="true">{cifry}</span>
      </div>
      <span className="sr-only" aria-live="polite">
        {obyavlenie}
      </span>
    </div>
  );
}
