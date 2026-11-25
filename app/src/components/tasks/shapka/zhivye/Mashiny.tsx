'use client';

import { useEffect, useRef, useState } from 'react';
import type { ZhivoyProps } from './tip';
import { Begunki, Begunok, Formula, klamp, ZhivoyKoren, type Tochka } from './obshchee';
import { tex } from './grafik';
import './grafiki.css';

/** Дорога — кривая Безье, как извилистая стеклянная дорога на картинке. */
const P: Tochka[] = [
  [38, 138],
  [60, 40],
  [198, 168],
  [222, 58],
];
const RASSTOYANIE = 120;
const EDUT_MS = 2200;

function bezye(t: number): Tochka {
  const u = 1 - t;
  const [a, b, c, d] = P as [Tochka, Tochka, Tochka, Tochka];
  return [
    u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0],
    u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1],
  ];
}

/* Таблица длин: точка дороги по доле пройденного пути. */
const N = 160;
const TOCHKI = Array.from({ length: N + 1 }, (_, i) => bezye(i / N));
const DLINY = [0];
for (let i = 1; i <= N; i += 1) {
  const a = TOCHKI[i - 1]!;
  const b = TOCHKI[i]!;
  DLINY.push(DLINY[i - 1]! + Math.hypot(b[0] - a[0], b[1] - a[1]));
}
const VSYA = DLINY[N]!;
const DOROGA = TOCHKI.map(
  (p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`,
).join('');

/** Точка и направление (градусы) на доле q пути от начала. */
function naDoroge(q: number): { p: Tochka; ugol: number } {
  const s = klamp(q, 0, 1) * VSYA;
  let i = 1;
  while (i < N && DLINY[i]! < s) i += 1;
  const a = TOCHKI[i - 1]!;
  const b = TOCHKI[i]!;
  const t = (s - DLINY[i - 1]!) / (DLINY[i]! - DLINY[i - 1]! || 1);
  return {
    p: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t],
    ugol: (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI,
  };
}

function Mashina({ q, nazad, ton }: { q: number; nazad: boolean; ton: 'blue' | 'or' }) {
  const { p, ugol } = naDoroge(q);
  const kuzov = ton === 'blue' ? 'var(--chertezh-setka)' : 'var(--chertezh-akcent)';
  const kray = ton === 'blue' ? 'var(--chertezh-siniy)' : 'var(--chertezh-akcent-tekst)';
  return (
    <g transform={`translate(${p[0]} ${p[1]}) rotate(${ugol + (nazad ? 180 : 0)})`}>
      <rect
        x={-12}
        y={-6.5}
        width={24}
        height={13}
        rx={5}
        fill={kuzov}
        stroke={kray}
        strokeWidth={1.2}
      />
      <rect
        x={-3}
        y={-5}
        width={8}
        height={10}
        rx={2.5}
        fill="color-mix(in srgb, var(--chertezh-goluboy-svet) 90%, transparent)"
      />
      <circle cx={10} cy={-4} r={1.4} fill="var(--chertezh-akcent-zalivka)" />
      <circle cx={10} cy={4} r={1.4} fill="var(--chertezh-akcent-zalivka)" />
    </g>
  );
}

/**
 * №10 «Текстовые задачи»: две машины на извилистой дороге едут
 * навстречу. Бегунками задаются скорости, кнопка «Поехали» запускает
 * движение (повтор — «Ещё раз»), точка встречи подсвечивается.
 */
export default function Mashiny({ label, tiho, avtofokus }: ZhivoyProps) {
  const [v1, setV1] = useState(60);
  const [v2, setV2] = useState(80);
  const [hod, setHod] = useState(0);
  const [edut, setEdut] = useState(false);
  const kadr = useRef(0);

  const q = v1 / (v1 + v2);
  const T = RASSTOYANIE / (v1 + v2);
  const vstretilis = hod >= 1;
  const vstrecha = naDoroge(q).p;

  useEffect(() => () => cancelAnimationFrame(kadr.current), []);

  const poehali = () => {
    cancelAnimationFrame(kadr.current);
    if (tiho) {
      setHod(1);
      return;
    }
    setEdut(true);
    const start = performance.now();
    const shag = (t: number) => {
      const x = Math.min(1, (t - start) / EDUT_MS);
      setHod(x);
      if (x < 1) kadr.current = requestAnimationFrame(shag);
      else setEdut(false);
    };
    kadr.current = requestAnimationFrame(shag);
  };
  const skorost = (set: (v: number) => void) => (v: number) => {
    cancelAnimationFrame(kadr.current);
    setEdut(false);
    setHod(0);
    set(v);
  };

  return (
    <ZhivoyKoren
      label={label}
      avtofokus={avtofokus}
      naStrelku={(d) => {
        if (d[0] !== 0) skorost(setV1)(klamp(v1 + Math.sign(d[0]) * 5, 40, 100));
        if (d[1] !== 0) skorost(setV2)(klamp(v2 - Math.sign(d[1]) * 5, 40, 100));
      }}
      naEnter={poehali}
    >
      <svg viewBox="0 0 260 260" aria-hidden="true">
        <path className="zhg__doroga-kray" d={DOROGA} />
        <path className="zhg__doroga" d={DOROGA} />
        <path className="zhg__razmetka" d={DOROGA} />
        <circle
          className={`zhg__vstrecha ${vstretilis ? 'is-est' : ''}`}
          cx={vstrecha[0]}
          cy={vstrecha[1]}
          r={vstretilis ? 15 : 12}
        />
        <Mashina q={q * hod} nazad={false} ton="blue" />
        <Mashina q={1 - (1 - q) * hod} nazad ton="or" />
        <text className="zhv__t" x={P[0]![0] - 4} y={P[0]![1] + 26}>
          A
        </text>
        <text className="zhv__t" x={P[3]![0] - 4} y={P[3]![1] - 18}>
          B
        </text>
        {vstretilis ? (
          <text className="zhv__t" x={vstrecha[0] + 18} y={vstrecha[1] - 12}>
            встреча
          </text>
        ) : null}
      </svg>
      <span className="zhv__plashka zhv__plashka--verh">
        <Formula tex={`t=\\dfrac{${RASSTOYANIE}}{${v1}+${v2}}\\approx ${tex(T, 2)}`} />
        <span>ч</span>
      </span>
      <Begunki>
        <Begunok
          podpis={<span style={{ color: 'var(--chertezh-siniy)' }}>v₁</span>}
          min={40}
          max={100}
          shag={5}
          znachenie={v1}
          pokaz={`${v1} км/ч`}
          menyat={skorost(setV1)}
        />
        <Begunok
          podpis={<span style={{ color: 'var(--chertezh-akcent-tekst)' }}>v₂</span>}
          min={40}
          max={100}
          shag={5}
          znachenie={v2}
          pokaz={`${v2} км/ч`}
          menyat={skorost(setV2)}
        />
        <button type="button" className="zhv__knopka" onClick={poehali} disabled={edut}>
          {hod > 0 ? 'Ещё раз' : 'Поехали'}
        </button>
      </Begunki>
    </ZhivoyKoren>
  );
}
