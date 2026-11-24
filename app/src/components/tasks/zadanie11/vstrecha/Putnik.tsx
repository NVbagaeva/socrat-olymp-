import { clsx } from 'clsx';
import { poza } from '@/lib/zadanie11/vstrecha';

/**
 * Путник — плоская векторная фигурка с походкой. Начало координат —
 * между ступнями на дороге, лицом вправо; второй путник отражён.
 * Углы суставов считает lib/zadanie11/vstrecha.ts → poza(φ, amp):
 * amp = 0 — стоит ровно (на старте, на встрече и при «Уменьшить
 * движение»).
 */

export type TonPutnika = 'sin' | 'terra';

const BEDRO = 20;
const GOLEN = 19;
const PLECHO = 15;
const PREDPLECHE = 14;
const Y_TAZ = -40;
const Y_PLECHI = -67;

function Noga({ bedro, golen, klass }: { bedro: number; golen: number; klass: string }) {
  return (
    <g className={klass} transform={`translate(0 ${Y_TAZ}) rotate(${bedro.toFixed(2)})`}>
      <line x1="0" y1="0" x2="0" y2={BEDRO} />
      <g transform={`translate(0 ${BEDRO}) rotate(${golen.toFixed(2)})`}>
        <line x1="0" y1="0" x2="0" y2={GOLEN} />
        <path
          className="z11-put__botinok"
          d={`M-3.5 ${GOLEN - 3} h8.5 a3.5 3.5 0 0 1 0 7 h-8.5 z`}
        />
      </g>
    </g>
  );
}

function Ruka({ plecho, lokot, klass }: { plecho: number; lokot: number; klass: string }) {
  return (
    <g className={klass} transform={`translate(0 ${Y_PLECHI}) rotate(${plecho.toFixed(2)})`}>
      <line x1="0" y1="0" x2="0" y2={PLECHO} />
      <g transform={`translate(0 ${PLECHO}) rotate(${lokot.toFixed(2)})`}>
        <line x1="0" y1="0" x2="0" y2={PREDPLECHE} />
        <circle className="z11-put__kist" cx="0" cy={PREDPLECHE + 1} r="2.8" />
      </g>
    </g>
  );
}

export function Putnik({
  ton,
  x,
  y,
  masshtab,
  phi,
  amp,
  prizrak = false,
}: {
  ton: TonPutnika;
  x: number;
  y: number;
  masshtab: number;
  /** Фаза шага, радианы. */
  phi: number;
  /** Размах походки 0…1. */
  amp: number;
  /** Полупрозрачный силуэт-«снимок» на отметке 1 ч. */
  prizrak?: boolean;
}) {
  const p = poza(phi, amp);
  const dir = ton === 'terra' ? -1 : 1;
  return (
    <g
      className={clsx('z11-put', `z11-put--${ton}`, prizrak && 'z11-put--prizrak')}
      transform={`translate(${x.toFixed(2)} ${y}) scale(${dir * masshtab} ${masshtab})`}
      aria-hidden="true"
    >
      <ellipse className="z11-put__ten" cx="1" cy="2" rx={15 - p.pod} ry="3.6" />
      <g transform={`translate(0 ${p.pod.toFixed(2)})`}>
        {/* Дальние рука и нога — темнее. */}
        <Ruka plecho={p.plechoR} lokot={p.lokotR} klass="z11-put__ruka z11-put__ruka--dal" />
        <Noga bedro={p.bedroR} golen={p.golenR} klass="z11-put__noga z11-put__noga--dal" />
        {/* Рюкзак. */}
        <rect className="z11-put__ryukzak" x="-14" y="-70" width="10" height="20" rx="4" />
        {/* Туловище — куртка. */}
        <path className="z11-put__kurtka" d="M-7 -72 q7 -4 14 0 l1 30 q-8 4 -16 0 z" />
        <path className="z11-put__blik" d="M-4 -68 q3 -1.5 6 0 v8" />
        <Noga bedro={p.bedroL} golen={p.golenL} klass="z11-put__noga" />
        {/* Голова: шея, лицо, волосы. */}
        <g transform={`translate(1 -82) rotate(${p.golova.toFixed(2)})`}>
          <rect className="z11-put__kozha" x="-2.5" y="6" width="5" height="6" rx="2" />
          <circle className="z11-put__kozha" cx="0" cy="0" r="8.5" />
          <path
            className="z11-put__volosy"
            d="M-8.6 0.5 a8.6 8.6 0 0 1 15.8 -4.8 q-6 0.6 -9.6 3.4 q-2.2 1.6 -6.2 1.4 z"
          />
          <circle className="z11-put__glaz" cx="4.6" cy="-0.6" r="1.1" />
        </g>
        <Ruka plecho={p.plechoL} lokot={p.lokotL} klass="z11-put__ruka" />
      </g>
    </g>
  );
}
