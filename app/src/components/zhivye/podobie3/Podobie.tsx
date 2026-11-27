'use client';

import { clsx } from 'clsx';
import { useMemo, useRef, useState } from 'react';
import { PODOBIE3 as T } from '@/content/zhivye3';
import { ru } from '@/lib/zhivye/hod';
import { KOEFFICIENTY, PROEKCIYA, hodPodobie, kadr, linitsy, tochka } from '@/lib/zhivye/podobie3';
import { Podpis, Taymlayn, Upravlenie, klavishi, tex } from '../Elementy';
import { useDvizhenie, useHod, useShirina } from '../hooks';
import '../zhivye.css';
import './podobie3.css';

/**
 * «Длины в k раз, площади в k², объёмы в k³» (глава «Изменение
 * размеров и подобие», №3): ребро, грань и куб растут от единицы до k
 * и считаются единичными клетками. Модель — lib/zhivye/podobie3.ts.
 */

export default function Podobie() {
  const [iK, setIK] = useState(0);
  const k = KOEFFICIENTY[iK] ?? 2;
  const o = useMemo(() => hodPodobie(), []);
  const hod = useHod(o);
  const obertka = useRef<HTMLDivElement>(null);
  const W = useShirina(obertka);
  const dvizhenie = useDvizhenie();
  const { t } = hod.kadr;
  const konec = t >= 3 - 1e-9;

  let status = T.status.start(k);
  if (konec) status = T.status.konec(k);
  else if (t > 2 - 1e-9) status = T.status.obem(k);
  else if (t > 1 - 1e-9) status = T.status.ploshchad(k);
  else if (t > 1e-9 || hod.kadr.igraet) status = T.status.dlina(k);
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
      <div className="zv3-vybor">
        <span className="zv3-vybor-zag">{T.koef}</span>
        <div className="zv-seg" role="group" aria-label={T.koef}>
          {KOEFFICIENTY.map((x, i) => (
            <button
              key={x}
              type="button"
              className={clsx(i === iK && 'is-on')}
              aria-pressed={i === iK}
              onClick={() => {
                setIK(i);
                hod.sbros();
              }}
            >
              {T.koefKnopka(x)}
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
        aria-label={`${T.ariaZag}. ${T.upravlenie.klaviatura}`}
      >
        {W > 0 ? <Svg W={W} k={k} t={t} /> : null}
      </div>
      <ul className="zv3-itog">
        {T.itog.map((x, i) => (
          <li
            key={x.zag}
            className={clsx(
              t >= i + 1 - 1e-9 && 'is-gotovo',
              faza === i && !konec && t > 1e-9 && 'is-idet',
            )}
          >
            <span className="zv3-itog-zag">{x.zag}</span>
            <span className="zv3-itog-tex" dangerouslySetInnerHTML={{ __html: tex(x.tex(k)) }} />
          </li>
        ))}
      </ul>
      <p
        className="zv-status"
        aria-live="polite"
        dangerouslySetInnerHTML={{ __html: tex(status) }}
      />
      <Upravlenie hod={hod} T={T.upravlenie} konec={konec} />
    </div>
  );
}

function Svg({ W, k, t }: { W: number; k: number; t: number }) {
  const uzko = W < 560;
  const pole = uzko ? 14 : 40;
  const pad = 22;
  const u = Math.min(
    (W - 2 * pole) / ((1 + PROEKCIYA.dx) * k),
    (uzko ? 300 : 380) / ((1 + PROEKCIYA.dy) * k),
  );
  const H = Math.round((1 + PROEKCIYA.dy) * k * u + 2 * pad);
  const ox = (W - (1 + PROEKCIYA.dx) * k * u) / 2;
  const oy = H - pad;
  const Q = (x: number, y: number, z: number): [number, number] => tochka(x, y, z, u, ox, oy);
  const poly = (...pts: [number, number][]) =>
    pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const { etap, s, velichina } = kadr(k, t);
  const liniya = linitsy(s);
  const v = ru(velichina, 1);

  const linii = (a: [number, number], b: [number, number], key: string) => (
    <line key={key} className="zv3-setka" x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />
  );

  let figura: React.ReactNode;
  let podpis: React.ReactNode;

  if (etap === 0) {
    const z = k / 2;
    const a = Q(0, 0, z);
    const b = Q(s, 0, z);
    const kon = Q(k, 0, z);
    figura = (
      <g>
        <line className="zv3-prizrak" x1={a[0]} y1={a[1]} x2={kon[0]} y2={kon[1]} />
        <line className="zv3-otrezok" x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />
        {[0, ...liniya, ...(s >= k - 1e-9 ? [k] : [])].map((i) => (
          <g key={i}>
            <line
              className="zv3-tik"
              x1={Q(i, 0, z)[0]}
              x2={Q(i, 0, z)[0]}
              y1={a[1] - 7}
              y2={a[1] + 7}
            />
            <text className="zv3-chislo" x={Q(i, 0, z)[0]} y={a[1] + 24} textAnchor="middle">
              {i}
            </text>
          </g>
        ))}
        <circle className="zv3-konec" cx={b[0]} cy={b[1]} r="5" />
      </g>
    );
    podpis = <Podpis x={(a[0] + b[0]) / 2} y={a[1] - 24} text={T.svgDlina(v)} klass="is-zhar" />;
  } else if (etap === 1) {
    figura = (
      <g>
        <polygon
          className="zv3-gran zv3-gran--pered"
          points={poly(Q(0, 0, 0), Q(s, 0, 0), Q(s, 0, s), Q(0, 0, s))}
        />
        {liniya.map((i) => linii(Q(i, 0, 0), Q(i, 0, s), `v${i}`))}
        {liniya.map((i) => linii(Q(0, 0, i), Q(s, 0, i), `h${i}`))}
        <polygon
          className="zv3-edinitsa"
          points={poly(Q(0, 0, 0), Q(1, 0, 0), Q(1, 0, 1), Q(0, 0, 1))}
        />
      </g>
    );
    podpis = (
      <Podpis
        x={Q(s / 2, 0, s / 2)[0]}
        y={Q(s / 2, 0, s / 2)[1]}
        text={T.svgPloshchad(v)}
        klass="is-zhar"
      />
    );
  } else {
    figura = (
      <g>
        <polygon
          className="zv3-gran zv3-gran--pered"
          points={poly(Q(0, 0, 0), Q(s, 0, 0), Q(s, 0, s), Q(0, 0, s))}
        />
        <polygon
          className="zv3-gran zv3-gran--verh"
          points={poly(Q(0, 0, s), Q(s, 0, s), Q(s, s, s), Q(0, s, s))}
        />
        <polygon
          className="zv3-gran zv3-gran--prav"
          points={poly(Q(s, 0, 0), Q(s, s, 0), Q(s, s, s), Q(s, 0, s))}
        />
        {liniya.map((i) => linii(Q(i, 0, 0), Q(i, 0, s), `fv${i}`))}
        {liniya.map((i) => linii(Q(0, 0, i), Q(s, 0, i), `fh${i}`))}
        {liniya.map((i) => linii(Q(i, 0, s), Q(i, s, s), `tv${i}`))}
        {liniya.map((i) => linii(Q(0, i, s), Q(s, i, s), `th${i}`))}
        {liniya.map((i) => linii(Q(s, i, 0), Q(s, i, s), `rv${i}`))}
        {liniya.map((i) => linii(Q(s, 0, i), Q(s, s, i), `rh${i}`))}
        <polygon
          className="zv3-edinitsa"
          points={poly(Q(0, 0, 0), Q(1, 0, 0), Q(1, 0, 1), Q(0, 0, 1))}
        />
      </g>
    );
    podpis = (
      <Podpis
        x={Q(s / 2, 0, s / 2)[0]}
        y={Q(s / 2, 0, s / 2)[1]}
        text={T.svgObem(v)}
        klass="is-zhar"
      />
    );
  }

  return (
    <svg
      className="zv-svg"
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={T.alt}
    >
      {figura}
      {podpis}
    </svg>
  );
}
