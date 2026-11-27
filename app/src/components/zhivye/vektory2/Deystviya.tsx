'use client';

import { clsx } from 'clsx';
import { useMemo, useRef, useState } from 'react';
import { DEYSTVIYA2 as T } from '@/content/zhivye2';
import {
  NABORY,
  hodVektory,
  kadr,
  kratnoe,
  raznost,
  ramka,
  summa,
  type Nabor,
  type T2,
} from '@/lib/zhivye/vektory2';
import { Podpis, Taymlayn, Upravlenie, klavishi, tex } from '../Elementy';
import { useDvizhenie, useHod, useShirina } from '../hooks';
import '../zhivye.css';
import './vektory2.css';

/**
 * «Сумма, разность и умножение на число» (справочник №2): векторы на
 * координатной сетке, действия идут по координатам. Модель —
 * lib/zhivye/vektory2.ts.
 */

export default function Deystviya() {
  const [iN, setIN] = useState(0);
  const n = NABORY[iN] as Nabor;
  const o = useMemo(() => hodVektory(), []);
  const hod = useHod(o);
  const obertka = useRef<HTMLDivElement>(null);
  const W = useShirina(obertka);
  const dvizhenie = useDvizhenie();
  const { t } = hod.kadr;
  const konec = t >= 3 - 1e-9;

  let status = T.status.start(n.a, n.b);
  if (konec) status = T.status.kratnoe(n.a, kratnoe(n));
  else if (t > 2 - 1e-9) status = T.status.kratnoe(n.a, kratnoe(n));
  else if (t > 1 - 1e-9) status = T.status.raznost(n.a, n.b, raznost(n));
  else if (t > 1e-9 || hod.kadr.igraet) status = T.status.summa(n.a, n.b, summa(n));
  const faza = Math.min(2, Math.max(0, Math.ceil(t - 1e-9) - 1));

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
      <div className="zv2-vybor">
        <span className="zv2-vybor-zag">{T.nabor}</span>
        <div className="zv-seg" role="group" aria-label={T.nabor}>
          {NABORY.map((x, i) => (
            <button
              key={x.id}
              type="button"
              className={clsx(i === iN && 'is-on')}
              aria-pressed={i === iN}
              onClick={() => {
                setIN(i);
                hod.sbros();
              }}
            >
              {T.nabory[x.id]}
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
        {W > 0 ? <Svg W={W} n={n} t={t} /> : null}
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

type Px = readonly [number, number];

/** Стрелка из p в q (пиксели): линия и наконечник. */
function Strelka({ p, q, klass }: { p: Px; q: Px; klass: string }) {
  const dx = q[0] - p[0];
  const dy = q[1] - p[1];
  const L = Math.hypot(dx, dy);
  if (L < 1.5) return null;
  const ux = dx / L;
  const uy = dy / L;
  const g = Math.min(12, L * 0.6);
  const bx = q[0] - ux * g;
  const by = q[1] - uy * g;
  const w = g * 0.42;
  return (
    <g className={clsx('zv2-vektor', klass)}>
      <line x1={p[0]} y1={p[1]} x2={bx} y2={by} />
      <polygon
        points={`${q[0]},${q[1]} ${bx - uy * w},${by + ux * w} ${bx + uy * w},${by - ux * w}`}
      />
    </g>
  );
}

function Svg({ W, n, t }: { W: number; n: Nabor; t: number }) {
  const uzko = W < 560;
  const r = ramka(n);
  const w = r.x1 - r.x0;
  const h = r.y1 - r.y0;
  const pole = uzko ? 12 : 40;
  const k = Math.min((W - 2 * pole) / w, (uzko ? 300 : 360) / h);
  const x0 = (W - w * k) / 2;
  const pad = 14;
  const H = Math.round(h * k + 2 * pad);
  const P = (p: T2): Px => [x0 + (p[0] - r.x0) * k, H - pad - (p[1] - r.y0) * k];
  const kd = kadr(n, t);
  const naMeste = (e: number) => kd.etap === e && kd.u >= 1 - 1e-9;
  const O = P([0, 0]);

  const xs = Array.from({ length: w + 1 }, (_, i) => r.x0 + i);
  const ys = Array.from({ length: h + 1 }, (_, i) => r.y0 + i);

  /* Подпись у середины стрелки, сдвинутая от неё в сторону. */
  const sered = (p: T2, q: T2, sdvig: number, text: string, klass: string) => {
    const a = P(p);
    const b = P(q);
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const L = Math.hypot(dx, dy) || 1;
    return (
      <Podpis
        x={(a[0] + b[0]) / 2 + (-dy / L) * sdvig}
        y={(a[1] + b[1]) / 2 + (dx / L) * sdvig}
        text={text}
        klass={klass}
      />
    );
  };

  const rezKlass = 'is-rez';
  const rezText = T.svgRez[kd.etap] ?? '';
  /* Значение вектора-результата (не его положение): a − b идёт из конца b в конец a. */
  const znachenie = [summa, raznost, kratnoe][kd.etap]?.(n) ?? kd.rez.do;

  return (
    <svg
      className="zv-svg"
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={T.alt}
    >
      {xs.map((x) => (
        <line
          key={`x${x}`}
          className="zv2-setka"
          x1={P([x, r.y0])[0]}
          x2={P([x, r.y1])[0]}
          y1={P([x, r.y0])[1]}
          y2={P([x, r.y1])[1]}
        />
      ))}
      {ys.map((y) => (
        <line
          key={`y${y}`}
          className="zv2-setka"
          x1={P([r.x0, y])[0]}
          x2={P([r.x1, y])[0]}
          y1={P([r.x0, y])[1]}
          y2={P([r.x1, y])[1]}
        />
      ))}
      <line className="zv2-os" x1={P([r.x0, 0])[0]} x2={P([r.x1, 0])[0]} y1={O[1]} y2={O[1]} />
      <line className="zv2-os" x1={O[0]} x2={O[0]} y1={P([0, r.y0])[1]} y2={P([0, r.y1])[1]} />
      {xs
        .filter((x) => x !== 0 && x % (uzko ? 2 : 1) === 0)
        .map((x) => (
          <text
            key={`tx${x}`}
            className="zv2-tik"
            x={P([x, 0])[0]}
            y={O[1] + 14}
            textAnchor="middle"
          >
            {String(x).replace('-', '−')}
          </text>
        ))}
      {ys
        .filter((y) => y !== 0 && y % (uzko ? 2 : 1) === 0)
        .map((y) => (
          <text
            key={`ty${y}`}
            className="zv2-tik"
            x={O[0] - 7}
            y={P([0, y])[1] + 4}
            textAnchor="end"
          >
            {String(y).replace('-', '−')}
          </text>
        ))}
      {kd.bezA ? null : <Strelka p={O} q={P(n.a)} klass="is-a" />}
      {kd.bezB ? null : <Strelka p={O} q={P(n.b)} klass="is-b" />}
      {kd.kopiyaB === null ? null : (
        <Strelka p={P(kd.kopiyaB.ot)} q={P(kd.kopiyaB.do)} klass="is-b is-kopiya" />
      )}
      {kd.rez.vid > 0 ? (
        <g opacity={kd.rez.vid}>
          <Strelka p={P(kd.rez.ot)} q={P(kd.rez.do)} klass={rezKlass} />
        </g>
      ) : null}
      {kd.bezA ? null : sered([0, 0], n.a, uzko ? 15 : 17, T.svgA, 'is-sin')}
      {kd.bezB ? null : sered([0, 0], n.b, uzko ? -15 : -17, T.svgB, 'is-zhar')}
      {kd.rez.vid > 0.5 ? sered(kd.rez.ot, kd.rez.do, uzko ? -17 : -20, rezText, 'is-rez') : null}
      {naMeste(kd.etap) ? (
        <Podpis
          x={Math.max(34, Math.min(W - 34, P(kd.rez.do)[0] + (uzko ? 0 : 6)))}
          y={Math.max(14, Math.min(H - 14, P(kd.rez.do)[1] - 22))}
          text={T.svgKoordinaty(znachenie)}
          klass="is-rez"
        />
      ) : null}
      <circle className="zv2-nachalo" cx={O[0]} cy={O[1]} r="3.5" />
    </svg>
  );
}
