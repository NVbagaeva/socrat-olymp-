'use client';

import { useState, type PointerEvent } from 'react';
import type { ZhivoyProps } from './tip';
import { Formula, ZhivoyKoren, type Tochka } from './obshchee';
import { Kubik, useBrosok } from './kubik';
import { useVrashchenie } from './tri';
import './kost.css';

const C: Tochka = [108, 132];
const M = 34;

/** Стеклянный шарик композиции — как на картинке. */
function Shar({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <g aria-hidden="true">
      <circle cx={x} cy={y} r={r} fill="url(#kost-shar)" stroke="rgb(61 121 224 / 0.45)" />
      <ellipse
        cx={x - r * 0.35}
        cy={y - r * 0.4}
        rx={r * 0.32}
        ry={r * 0.2}
        fill="rgb(255 255 255 / 0.85)"
      />
    </g>
  );
}

/**
 * №4 «Вероятность: простая»: стеклянная игральная кость. Нажатие или
 * Enter подбрасывает её; выпавшая грань (верхняя) подсвечивается, рядом
 * — счётчик исходов по граням и частота выпавшей грани. Кость можно
 * покрутить, пока никто не трогает — медленно вращается сама.
 */
export default function Kost({ label, tiho, avtofokus }: ZhivoyProps) {
  const vr = useVrashchenie({ azimut: 28, vysota: 20 }, tiho);
  const { ugly, pod, letit, brosit } = useBrosok(tiho, { rx: 0, ry: 0, rz: 0 });
  const [ishody, setIshody] = useState<number[]>([0, 0, 0, 0, 0, 0]);
  const [vypalo, setVypalo] = useState<number | null>(null);
  const vsego = ishody.reduce((a, b) => a + b, 0);

  const brosok = () => {
    if (letit) return;
    const k = 1 + Math.floor(Math.random() * 6);
    setVypalo(null);
    brosit(k, () => {
      setVypalo(k);
      setIshody((h) => h.map((v, i) => (i === k - 1 ? v + 1 : v)));
    });
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    vr.pointer.onPointerUp(e);
    if (!vr.bylPovorot()) brosok();
  };

  return (
    <ZhivoyKoren
      label={label}
      avtofokus={avtofokus}
      className="zhv--3d zhv-kost"
      naStrelku={(d, e) => vr.naStrelku(d, e)}
      naEnter={brosok}
      {...vr.pointer}
      onPointerUp={onPointerUp}
    >
      <svg viewBox="0 0 260 260" aria-hidden="true">
        <defs>
          <radialGradient id="kost-shar" cx="0.35" cy="0.3" r="0.8">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="0.6" stopColor="#bcd3f7" stopOpacity="0.6" />
            <stop offset="1" stopColor="#6f9be3" stopOpacity="0.7" />
          </radialGradient>
        </defs>
        {/* Стеклянные лепестки за костью и нить с шариком — как на картинке. */}
        <path
          d="M22 112 C 30 80, 90 74, 120 92 C 140 104, 150 130, 120 150 C 90 168, 40 160, 26 140 C 20 130, 20 120, 22 112Z"
          fill="rgb(190 212 248 / 0.45)"
          stroke="rgb(150 185 240 / 0.5)"
        />
        <path
          d="M140 112 C 160 96, 182 88, 182 100 C 182 120, 168 146, 146 152Z"
          fill="rgb(190 212 248 / 0.45)"
          stroke="rgb(150 185 240 / 0.5)"
        />
        <path
          d="M140 150 C 175 172, 205 128, 232 116 C 252 108, 250 140, 213 158 C 196 166, 180 178, 160 170"
          fill="none"
          stroke="rgb(120 160 230 / 0.6)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <Shar x={45} y={109} r={9} />
        <Shar x={36} y={160} r={18} />
        <Shar x={213} y={158} r={13} />
        <ellipse
          cx={C[0]}
          cy={C[1] + 52}
          rx={44 - pod * 10}
          ry={8 - pod * 2}
          fill="rgb(31 95 208 / 0.12)"
        />
        <Kubik
          b={vr.b}
          ugly={ugly}
          m={M}
          c={C}
          pod={pod}
          podsvetka={vypalo}
          bukvaP={vsego === 0 && !letit}
        />
      </svg>
      <span className="zhv__plashka zhv__plashka--verh kost__schet" aria-live="polite">
        {ishody.map((v, i) => (
          <span key={i} className={vypalo === i + 1 ? 'is-vypalo' : undefined}>
            <b>{i + 1}</b>
            {v}
          </span>
        ))}
      </span>
      <span className="zhv__plashka">
        {vypalo === null || vsego === 0 ? (
          vsego === 0 ? (
            'Нажми — бросить кость'
          ) : (
            'Летит…'
          )
        ) : (
          <>
            Бросков: {vsego} ·{' '}
            <Formula
              tex={`\\nu(${vypalo})=\\dfrac{${ishody[vypalo - 1]}}{${vsego}}\\approx ${(
                Math.round((ishody[vypalo - 1]! / vsego) * 100) / 100
              )
                .toString()
                .replace('.', '{,}')}`}
            />
          </>
        )}
      </span>
    </ZhivoyKoren>
  );
}
