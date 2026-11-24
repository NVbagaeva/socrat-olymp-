'use client';

import { clsx } from 'clsx';
import { useId, useRef, useState } from 'react';
import { KADRY_OTREZKA, OTREZOK12 as T } from '@/content/zhivye12';
import { ru, ruTex } from '@/lib/zhivye/hod';
import { KRIT, X_MAX, X_MIN, Y_LIM, f, itog, kandidaty } from '@/lib/zhivye/otrezok12';
import { EkskursiyaPanel, smeshatChisla, useEkskursiya } from '../Ekskursiya';
import { Podpis, tex } from '../Elementy';
import { useDvizhenie, useShirina } from '../hooks';
import '../zhivye.css';
import './otrezok12.css';

/**
 * «Где прячется наибольшее и наименьшее» (теория №12): отрезок [a; b]
 * скользит по графику y = x³ − 12x. Кандидаты — концы и нули
 * производной внутри отрезка; наибольшее и наименьшее перескакивают
 * между ними. Показ — общая «экскурсия» (components/zhivye/Ekskursiya):
 * тронул ползунок — концы твои. Модель — lib/zhivye/otrezok12.ts.
 */

const SHAG = 0.5;
const GRAN = 4;

export default function Otrezok() {
  const id = useId().replace(/:/g, '');
  const [aR, setA] = useState(KADRY_OTREZKA[0]?.s.a ?? -3);
  const [bR, setB] = useState(KADRY_OTREZKA[0]?.s.b ?? 3);
  const ek = useEkskursiya(KADRY_OTREZKA, smeshatChisla);
  const vzyat = () =>
    ek.vRuchnoy((s) => {
      setA(Math.round(s.a / SHAG) * SHAG);
      setB(Math.round(s.b / SHAG) * SHAG);
    });
  const a = ek.s === null ? aR : ek.s.a;
  const b = ek.s === null ? bR : ek.s.b;
  const obertka = useRef<HTMLDivElement>(null);
  const W = useShirina(obertka);
  const dvizhenie = useDvizhenie();
  const k = kandidaty(a, b);
  const { max, min } = itog(a, b);

  return (
    <div className="zv-osnova">
      <EkskursiyaPanel panel={ek.panel} />

      <div
        ref={obertka}
        className={clsx('zv-scena', `is-${dvizhenie}`)}
        tabIndex={0}
        role="group"
        aria-label={T.zag}
      >
        {W > 0 ? <Svg id={id} W={W} a={a} b={b} /> : null}
      </div>

      <div className="zv12-ruchki">
        {(
          [
            ['a', a, T.konecA, (v: number) => setA(Math.min(v, b - SHAG))],
            ['b', b, T.konecB, (v: number) => setB(Math.max(v, a + SHAG))],
          ] as const
        ).map(([imya, v, label, set]) => (
          <label key={imya} className="zv12-ruchka" htmlFor={`${id}-${imya}`}>
            <span dangerouslySetInnerHTML={{ __html: tex(`${label}$\\,=${ruTex(v, 1)}$`) }} />
            <input
              id={`${id}-${imya}`}
              type="range"
              min={-GRAN}
              max={GRAN}
              step={SHAG}
              value={Math.round(v / SHAG) * SHAG}
              aria-valuetext={ru(v, 1)}
              onChange={(e) => {
                const z = Number(e.currentTarget.value);
                vzyat();
                set(z);
              }}
            />
          </label>
        ))}
      </div>

      <div className="zv12-kandidaty">
        <p className="zv12-kandidaty-zag">{T.kandidaty}</p>
        <ul>
          {k.map((c) => (
            <li
              key={`${c.vid}${c.x}`}
              className={clsx(
                c.vid === 'krit' && 'is-krit',
                c === max && 'is-max',
                c === min && 'is-min',
              )}
              dangerouslySetInnerHTML={{
                __html: tex(`$y(${ruTex(c.x, 1)})=${ruTex(c.y, 1)}$`),
              }}
            />
          ))}
        </ul>
        <p
          className="zv-itog"
          dangerouslySetInnerHTML={{
            __html: tex(T.itog(ruTex(a, 1), ruTex(b, 1), ruTex(max.y, 1), ruTex(min.y, 1))),
          }}
        />
      </div>
    </div>
  );
}

/* ── SVG ── */

function Svg({ id, W, a, b }: { id: string; W: number; a: number; b: number }) {
  const uzko = W < 560;
  const H = uzko ? 300 : 340;
  const pad = { l: 16, r: 16, t: 26, b: 34 };
  const X = (x: number) => pad.l + ((W - pad.l - pad.r) * (x - X_MIN)) / (X_MAX - X_MIN);
  const Y = (y: number) => pad.t + ((H - pad.t - pad.b) * (Y_LIM - y)) / (2 * Y_LIM);
  const kriv = (ot: number, doX: number) => {
    const pts: string[] = [];
    const N = 200;
    for (let i = 0; i <= N; i += 1) {
      const x = ot + ((doX - ot) * i) / N;
      pts.push(`${X(x).toFixed(1)},${Y(f(x)).toFixed(1)}`);
    }
    return pts.join(' ');
  };
  const { max, min } = itog(a, b);
  const fmt = (v: number) => ru(v, 1);
  /* Подписи наибольшего и наименьшего: над и под точкой, у краёв — прижать. */
  const prizhat = (x: number, w: number) => Math.max(w / 2 + 4, Math.min(W - w / 2 - 4, x));

  return (
    <svg
      className="zv-svg"
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={T.alt}
    >
      <defs>
        <clipPath id={`${id}-pole`}>
          <rect x={0} y={pad.t - 6} width={W} height={H - pad.t - pad.b + 12} />
        </clipPath>
      </defs>
      {/* Отрезок — полоса. */}
      <rect
        className="zv12-polosa"
        x={X(a)}
        y={pad.t - 10}
        width={Math.max(0, X(b) - X(a))}
        height={H - pad.t - pad.b + 20}
        rx="10"
      />
      <path className="zv-os" d={`M${pad.l} ${Y(0)} H${W - pad.r}`} />
      <path className="zv-os" d={`M${X(0)} ${pad.t - 8} V${H - pad.b + 6}`} />
      <g clipPath={`url(#${id}-pole)`}>
        <polyline className="zv12-krivaya-ten" points={kriv(X_MIN, X_MAX)} />
        <polyline className="zv12-krivaya" points={kriv(a, b)} />
      </g>

      {/* Нули производной. */}
      {KRIT.map((x) => {
        const vnutri = x > a + 1e-9 && x < b - 1e-9;
        return (
          <g key={x} className={clsx('zv12-krit', vnutri ? 'is-vnutri' : 'is-vne')}>
            <line x1={X(x)} x2={X(x)} y1={Y(0)} y2={Y(f(x))} />
            <circle cx={X(x)} cy={Y(f(x))} r="5" />
            <text x={X(x)} y={Y(0) + (f(x) > 0 ? 18 : -8)} textAnchor="middle">
              {fmt(x)}
            </text>
          </g>
        );
      })}

      {/* Концы отрезка. */}
      {[a, b].map((x, i) => (
        <g key={i} className="zv12-konec">
          <line x1={X(x)} x2={X(x)} y1={Y(0)} y2={Y(Math.max(-Y_LIM, Math.min(Y_LIM, f(x))))} />
          <text x={X(x)} y={H - 10} textAnchor="middle">
            {i === 0 ? `a = ${fmt(x)}` : `b = ${fmt(x)}`}
          </text>
        </g>
      ))}

      {/* Наибольшее и наименьшее. */}
      {[
        { c: max, klass: 'is-zhar', text: T.svgMax(fmt(max.y)), dy: -20 },
        { c: min, klass: 'is-sin', text: T.svgMin(fmt(min.y)), dy: 20 },
      ].map(({ c, klass, text, dy }) => {
        const yy = Y(Math.max(-Y_LIM, Math.min(Y_LIM, c.y)));
        const w = text.length * 7.5 + 14;
        return (
          <g key={klass}>
            <circle className={clsx('zv12-ekstr', klass)} cx={X(c.x)} cy={yy} r="7" />
            <Podpis
              x={prizhat(X(c.x), w)}
              y={Math.max(12, Math.min(H - pad.b - 4, yy + dy))}
              text={text}
              klass={klass}
            />
          </g>
        );
      })}
    </svg>
  );
}
