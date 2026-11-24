'use client';

import { clsx } from 'clsx';
import { useMemo, useRef, useState } from 'react';
import { SUMMA1 as T } from '@/content/zhivye1';
import {
  TREUGOLNIKI,
  hodSumma,
  summa,
  vershiny,
  type Klin,
  type T2,
  type Treugolnik,
} from '@/lib/zhivye/planimetriya1';
import { Podpis, Taymlayn, Upravlenie, klavishi, tex } from '../Elementy';
import { useDvizhenie, useHod, useShirina } from '../hooks';
import { klinPath } from './Vpisannyy';
import '../zhivye.css';
import './planimetriya1.css';

/**
 * «Почему сумма углов треугольника — 180°» (справочник №1): через B
 * проводится прямая, параллельная AC; углы A и C переезжают к B
 * накрест лежащими и вместе с углом B заполняют развёрнутый угол.
 * Модель — lib/zhivye/planimetriya1.ts.
 */

export default function SummaUglov() {
  const [iT, setIT] = useState(0);
  const tr = TREUGOLNIKI[iT] as Treugolnik;
  const o = useMemo(() => hodSumma(), []);
  const hod = useHod(o);
  const obertka = useRef<HTMLDivElement>(null);
  const W = useShirina(obertka);
  const dvizhenie = useDvizhenie();
  const { t } = hod.kadr;
  const konec = t >= 3 - 1e-9;
  const { beta } = vershiny(tr);
  const a = tr.alfa;
  const c = tr.gamma;

  let status = T.status.start(a, beta, c);
  if (konec) status = T.status.konec(a, beta, c);
  else if (t > 2 - 1e-9) status = T.status.c(c);
  else if (t > 1 - 1e-9) status = T.status.a(a);
  else if (t > 1e-9 || hod.kadr.igraet) status = T.status.pryamaya;
  const faza = konec ? 4 : t < 1e-9 ? 0 : Math.min(3, Math.floor(t + 1e-9) + 1);

  return (
    <div
      className="zv-osnova"
      onKeyDown={klavishi(hod, {
        shag: 0.5,
        shagShift: 1,
        tMax: 3,
        okruglit: (x) => Math.round(x * 2) / 2,
      })}
    >
      <div className="zv1-vybor">
        <span className="zv1-vybor-zag">{T.vid}</span>
        <div className="zv-seg" role="group" aria-label={T.vid}>
          {TREUGOLNIKI.map((x, i) => (
            <button
              key={x.id}
              type="button"
              className={clsx(i === iT && 'is-on')}
              aria-pressed={i === iT}
              onClick={() => {
                setIT(i);
                hod.sbros();
              }}
            >
              {T.vidy[x.id]}
            </button>
          ))}
        </div>
      </div>
      <Taymlayn
        dolya={t / 3}
        strelka={(t / 3) * 360}
        puzyrHtml={tex(T.puzyr[faza] ?? '')}
        ariaLabel={T.ariaVremya}
        ariaValueText={(T.puzyr[faza] ?? '').replace(/\$|\\/g, '')}
        metki={T.metki.map((m, i) => ({ dolya: i / 3, text: m, proydena: t >= i - 1e-9 }))}
        tochki={[1, 2].map((x) => ({ dolya: x / 3, proydena: t >= x - 1e-9 }))}
        onDolya={(d) => hod.peremotat(d * 3)}
      />
      <div
        ref={obertka}
        className={clsx('zv-scena', `is-${dvizhenie}`)}
        tabIndex={0}
        role="group"
        aria-label={`${T.zag}. ${T.upravlenie.klaviatura}`}
      >
        {W > 0 ? <Svg W={W} tr={tr} t={t} /> : null}
      </div>
      <p
        className="zv-status"
        aria-live="polite"
        dangerouslySetInnerHTML={{ __html: tex(status) }}
      />
      <Upravlenie hod={hod} T={T.upravlenie} konec={konec} />
    </div>
  );
}

function Svg({ W, tr, t }: { W: number; tr: Treugolnik; t: number }) {
  const { A, B, C, beta } = vershiny(tr);
  const s = summa(tr, t);
  const uzko = W < 560;
  /* Масштаб: треугольник и прямая через B по ширине, высота — по треугольнику. */
  const pole = uzko ? 26 : 60;
  const xs = [A[0], B[0], C[0]];
  const minX = Math.min(...xs) - 2;
  const maxX = Math.max(...xs) + 2;
  const k = Math.min((W - 2 * pole) / (maxX - minX), (uzko ? 200 : 260) / B[1]);
  const x0 = (W - (maxX - minX) * k) / 2;
  const H = Math.round(B[1] * k + 120);
  const P = (p: T2): [number, number] => [x0 + (p[0] - minX) * k, H - 44 - p[1] * k];
  const [ax, ay] = P(A);
  const [bx, by] = P(B);
  const [cx, cy] = P(C);
  const rKlin = Math.min(uzko ? 40 : 58, (B[1] * k) / 2.4);
  const kl = (x: Klin, klass: string) => {
    const [vx, vy] = P(x.v);
    return <path className={clsx('zv1-ugol', klass)} d={klinPath([vx, vy], rKlin, x.ot, x.do)} />;
  };
  const dl = (W / 2) * s.pryamaya;
  const sred = (x: Klin) => (((x.ot + x.do) / 2) * Math.PI) / 180;
  const pod = (x: Klin, text: string, klass: string, r = rKlin + (uzko ? 34 : 48)) => {
    const [vx, vy] = P(x.v);
    const w = text.length * 7.4 + 14;
    return (
      <Podpis
        x={Math.max(w / 2 + 4, Math.min(W - w / 2 - 4, vx + r * Math.cos(sred(x))))}
        y={Math.max(14, Math.min(H - 14, vy - r * Math.sin(sred(x))))}
        text={text}
        klass={klass}
      />
    );
  };
  const naMeste = t >= 3 - 1e-9;

  return (
    <svg
      className="zv-svg"
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={T.alt}
    >
      {dl > 0 ? <line className="zv1-parallel" x1={bx - dl} x2={bx + dl} y1={by} y2={by} /> : null}
      <polygon className="zv1-treug" points={`${ax},${ay} ${bx},${by} ${cx},${cy}`} />
      {/* Следы углов на прежних местах. */}
      {t > 1 ? kl({ v: A, ot: 0, do: tr.alfa }, 'is-sled') : null}
      {t > 2 ? kl({ v: C, ot: 180 - tr.gamma, do: 180 }, 'is-sled') : null}
      {kl(s.klinB, 'is-b')}
      {kl(s.klinA, 'is-a')}
      {kl(s.klinC, 'is-c')}
      {pod(s.klinB, T.svgUgol('∠B', Math.round(beta)), 'is-sin', rKlin + (uzko ? 22 : 30))}
      {pod(s.klinA, T.svgUgol('∠A', tr.alfa), 'is-zhar')}
      {pod(s.klinC, T.svgUgol('∠C', tr.gamma), 'is-zel')}
      {(
        [
          ['A', ax, ay, 0, 22],
          ['B', bx, by, 0, -14],
          ['C', cx, cy, 0, 22],
        ] as const
      ).map(([b, x, y, dx, dy]) => (
        <g key={b}>
          <circle className="zv1-tochka" cx={x} cy={y} r="4.5" />
          <text className="zv1-bukva" x={x + dx} y={y + dy} textAnchor="middle">
            {b}
          </text>
        </g>
      ))}
      {naMeste ? (
        <g className="zv1-itog">
          <path
            d={`M${bx - rKlin - 10} ${by} A${rKlin + 10} ${rKlin + 10} 0 0 0 ${bx + rKlin + 10} ${by}`}
          />
          <text x={bx + rKlin + 14} y={by - 10}>
            180°
          </text>
        </g>
      ) : null}
    </svg>
  );
}
