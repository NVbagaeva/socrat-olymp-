'use client';

import { clsx } from 'clsx';
import { useId, useMemo, useRef, useState } from 'react';
import { PRIMERY_15, ZNAKI15 as T } from '@/content/zhivye15';
import { ru } from '@/lib/zhivye/hod';
import {
  granicy,
  hodZnakov,
  masshtabKrivoy,
  mnozhitelTex,
  mnozhitelText,
  neravenstvoTex,
  nuli,
  otvet,
  otvetTex,
  vysotaKrivoy,
  znakiPromezhutkov,
  znakMnozhitelya,
  znakProizvedeniya,
  type Kusok,
  type Primer15,
} from '@/lib/zhivye/znaki15';
import { Taymlayn, Upravlenie, klavishi, tex } from '../Elementy';
import { useDvizhenie, useHod, useShirina } from '../hooks';
import '../zhivye.css';
import './znaki15.css';

/**
 * «Как меняется знак произведения» (теория №15, метод интервалов):
 * пробная точка x идёт слева направо, у каждого множителя на своей
 * полосе рисуется его знак, внизу — знак произведения, сверху — график.
 * На каждом нуле — пауза: нечётная степень меняет знак, чётная — нет.
 * В конце — ответ на прямой. Модель — lib/zhivye/znaki15.ts.
 */

const zt = (z: number) => (z > 0 ? '+' : '-');
const zs = (z: number) => (z > 0 ? '+' : '−');

export default function Znaki() {
  const id = useId().replace(/:/g, '');
  const [iP, setIP] = useState(0);
  const p = PRIMERY_15[iP] as Primer15;
  const o = useMemo(() => hodZnakov(p), [p]);
  const hod = useHod(o);
  const obertka = useRef<HTMLDivElement>(null);
  const W = useShirina(obertka);
  const dvizhenie = useDvizhenie();
  const { xMin, xMax } = granicy(p);
  const { t } = hod.kadr;
  const x = xMin + t;
  const konec = t >= o.tMax - 1e-9;
  const n = useMemo(() => nuli(p), [p]);
  const ner = neravenstvoTex(p);
  const otv = useMemo(() => otvet(p), [p]);
  const nestrogo = p.znak === '>=' || p.znak === '<=';

  const naNule = n.find((z) => Math.abs(z.a - x) < 1e-6);
  let status = T.status.start(ner, n.map((z) => z.a).join(',\\ '));
  if (konec) status = T.status.konec(otvetTex(otv));
  else if (naNule !== undefined && (hod.kadr.snimokIdet || !hod.kadr.igraet)) {
    const mn = p.mnozhiteli
      .filter((m) => m.a === naNule.a)
      .map(mnozhitelTex)
      .join('');
    const bylo = znakProizvedeniya(p, naNule.a - 0.01);
    const stalo = znakProizvedeniya(p, naNule.a + 0.01);
    status =
      naNule.k % 2 === 1
        ? T.status.nechet(mn, String(naNule.a), naNule.k, zt(bylo), zt(stalo))
        : T.status.chet(mn, String(naNule.a), naNule.k, zt(stalo));
    if (nestrogo) status += T.status.vklyuchena;
  } else if (t > 0 || hod.kadr.igraet) status = T.status.idet;

  return (
    <div
      className="zv-osnova"
      onKeyDown={klavishi(hod, {
        shag: 0.5,
        shagShift: 1,
        tMax: o.tMax,
        okruglit: (v) => Math.round(v * 2) / 2,
      })}
    >
      <div className="zv15-vybor">
        <span className="zv15-vybor-zag">{T.primer}</span>
        <div className="zv-seg" role="group" aria-label={T.primer}>
          {PRIMERY_15.map((pr, i) => (
            <button
              key={pr.id}
              type="button"
              className={clsx(i === iP && 'is-on')}
              aria-pressed={i === iP}
              onClick={() => {
                setIP(i);
                hod.sbros();
              }}
              dangerouslySetInnerHTML={{ __html: tex(`$${neravenstvoTex(pr)}$`) }}
            />
          ))}
        </div>
      </div>

      <Taymlayn
        dolya={t / o.tMax}
        strelka={(t / o.tMax) * 360}
        puzyrHtml={tex(T.puzyr(xTex(x)))}
        ariaLabel={T.ariaVremya}
        ariaValueText={T.ariaPuzyr(ru(x, 1))}
        metki={[
          { dolya: 0, text: ru(xMin, 1), proydena: true },
          ...n.map((z) => ({
            dolya: (z.a - xMin) / o.tMax,
            text: ru(z.a, 0),
            proydena: x >= z.a - 1e-9,
          })),
        ]}
        tochki={n.map((z) => ({ dolya: (z.a - xMin) / o.tMax, proydena: x >= z.a - 1e-9 }))}
        onDolya={(d) => hod.peremotat(d * o.tMax)}
      />

      <div
        ref={obertka}
        className={clsx('zv-scena', `is-${dvizhenie}`)}
        tabIndex={0}
        role="group"
        aria-label={`${T.zag}. ${T.upravlenie.klaviatura}`}
      >
        {W > 0 ? (
          <Svg id={id} W={W} p={p} x={x} xMin={xMin} xMax={xMax} konec={konec} otv={otv} />
        ) : null}
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

function xTex(x: number): string {
  const r = Math.round(x * 10) / 10;
  if (Math.abs(x - Math.round(x)) < 1e-6) return `=${Math.round(x)}`;
  return `\\approx${String(r).replace('.', '{,}')}`;
}

/* ── SVG ── */

function Svg({
  id,
  W,
  p,
  x,
  xMin,
  xMax,
  konec,
  otv,
}: {
  id: string;
  W: number;
  p: Primer15;
  x: number;
  xMin: number;
  xMax: number;
  konec: boolean;
  otv: readonly Kusok[];
}) {
  const uzko = W < 560;
  const L = uzko ? 76 : 120;
  const x0 = L + 14;
  const x1 = W - 18;
  const X = (v: number) => x0 + ((x1 - x0) * (v - xMin)) / (xMax - xMin);
  const xp = X(x);

  const G = uzko ? 120 : 140;
  const yOs = 14 + G / 2;
  const amp = G / 2 - 8;
  const rowTop = 14 + G + 30;
  const rowH = 34;
  const mn = p.mnozhiteli;
  const yProizv = rowTop + mn.length * rowH + 10;
  const H = yProizv + rowH + 14;

  const n = nuli(p);
  const M = masshtabKrivoy(p);
  const Y = (v: number) => yOs - vysotaKrivoy(p, v, M) * amp;
  const krivaya = (ot: number, doX: number) => {
    const N = 220;
    const pts: string[] = [];
    for (let i = 0; i <= N; i += 1) {
      const v = ot + ((doX - ot) * i) / N;
      pts.push(`${X(v).toFixed(1)},${Y(v).toFixed(1)}`);
    }
    return pts.join(' ');
  };

  /* Полоса знаков: куски между нулями, видимые до точки x. */
  const polosa = (
    yC: number,
    h: number,
    znakV: (v: number) => number,
    tochkiRazr: readonly number[],
    klass: string,
  ) => {
    const gr = [xMin, ...tochkiRazr.filter((a) => a > xMin && a < xMax), xMax];
    const kuski: React.ReactNode[] = [];
    for (let i = 0; i + 1 < gr.length; i += 1) {
      const l = gr[i] as number;
      const r = gr[i + 1] as number;
      if (x <= l + 1e-9) break;
      const rr = Math.min(r, x);
      const z = znakV((l + r) / 2);
      const sered = (l + r) / 2;
      kuski.push(
        <g key={i}>
          <rect
            className={clsx('zv15-kusok', z > 0 ? 'is-plus' : 'is-minus')}
            x={X(l)}
            y={yC - h / 2}
            width={Math.max(0, X(rr) - X(l))}
            height={h}
          />
          {x >= sered ? (
            <text
              className="zv15-znak"
              x={X(sered)}
              y={yC + 0.5}
              dominantBaseline="middle"
              textAnchor="middle"
            >
              {zs(z)}
            </text>
          ) : null}
        </g>,
      );
    }
    return (
      <g className={klass}>
        <rect
          className="zv15-dorozhka"
          x={x0}
          y={yC - h / 2}
          width={x1 - x0}
          height={h}
          rx={h / 2}
        />
        <g clipPath={`url(#${id}-${klass})`}>{kuski}</g>
        <clipPath id={`${id}-${klass}`}>
          <rect x={x0} y={yC - h / 2} width={x1 - x0} height={h} rx={h / 2} />
        </clipPath>
      </g>
    );
  };

  const zP = znakiPromezhutkov(p);

  return (
    <svg
      className="zv-svg"
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={T.alt}
    >
      {/* График и прямая. */}
      <path className="zv-os" d={`M${x0 - 6} ${yOs} H${x1 + 6}`} />
      <polyline className="zv15-krivaya-ten" points={krivaya(xMin, xMax)} />
      {x > xMin ? <polyline className="zv15-krivaya" points={krivaya(xMin, x)} /> : null}

      {/* Ответ на прямой — в конце. */}
      {konec
        ? otv.map((u, i) => {
            const l = Number.isFinite(u.ot) ? X(u.ot) : x0 - 6;
            const r = Number.isFinite(u.do) ? X(u.do) : x1 + 6;
            return u.ot === u.do ? null : (
              <rect
                key={i}
                className="zv15-otvet"
                x={l}
                y={yOs - 5}
                width={r - l}
                height={10}
                rx={5}
              />
            );
          })
        : null}

      {n.map((z) => {
        const proyden = x >= z.a - 1e-9;
        const vOtvete =
          konec && otv.some((u) => (u.ot === z.a && u.otVkl) || (u.do === z.a && u.doVkl));
        return (
          <g key={z.a} className={clsx('zv15-nul', proyden && 'is-proyden')}>
            <line x1={X(z.a)} x2={X(z.a)} y1={yOs} y2={yProizv + rowH / 2} />
            <circle className={clsx(vOtvete && 'is-vkl')} cx={X(z.a)} cy={yOs} r="5.5" />
            <text x={X(z.a)} y={yOs + 22} textAnchor="middle">
              {ru(z.a, 0)}
            </text>
          </g>
        );
      })}

      {/* Знаки над прямой на пройденных промежутках. */}
      {zP.map((z, i) => {
        const gr = [xMin, ...n.map((u) => u.a), xMax];
        const sered = ((gr[i] as number) + (gr[i + 1] as number)) / 2;
        return x >= sered ? (
          <text
            key={i}
            className={clsx('zv15-znak-os', z > 0 ? 'is-plus' : 'is-minus')}
            x={X(sered)}
            y={z > 0 ? 24 : 14 + G - 2}
            textAnchor="middle"
          >
            {zs(z)}
          </text>
        ) : null;
      })}

      {/* Полосы множителей. */}
      {mn.map((m, i) => {
        const yC = rowTop + i * rowH + rowH / 2;
        return (
          <g key={i}>
            <text
              className="zv15-metka"
              x={L}
              y={yC + 0.5}
              textAnchor="end"
              dominantBaseline="middle"
            >
              {mnozhitelText(m)}
            </text>
            {polosa(yC, 20, (v) => znakMnozhitelya(m, v), [m.a], `m${i}`)}
          </g>
        );
      })}

      {/* Произведение. */}
      <text
        className="zv15-metka is-glavnaya"
        x={L}
        y={yProizv + rowH / 2 + 0.5}
        textAnchor="end"
        dominantBaseline="middle"
      >
        {uzko ? T.svgProizvedenie : T.svgProizvedenieShiroko}
      </text>
      {polosa(
        yProizv + rowH / 2,
        26,
        (v) => znakProizvedeniya(p, v),
        n.map((z) => z.a),
        'pr',
      )}

      {/* Пробная точка. */}
      {!konec ? (
        <g className="zv15-proba">
          <line x1={xp} x2={xp} y1={8} y2={yProizv + rowH / 2 + 16} />
          <circle className="zv15-proba-graf" cx={xp} cy={Y(x)} r="6" />
          {mn.map((m, i) => {
            const z = znakMnozhitelya(m, x);
            return <Fishka key={i} x={xp} y={rowTop + i * rowH + rowH / 2} z={z} />;
          })}
          <Fishka x={xp} y={yProizv + rowH / 2} z={znakProizvedeniya(p, x)} glavnaya />
        </g>
      ) : null}
    </svg>
  );
}

function Fishka({ x, y, z, glavnaya }: { x: number; y: number; z: number; glavnaya?: boolean }) {
  const r = glavnaya ? 13 : 11;
  return (
    <g
      className={clsx('zv15-fishka', z > 0 ? 'is-plus' : z < 0 ? 'is-minus' : 'is-nul')}
      transform={`translate(${x.toFixed(2)} ${y.toFixed(2)})`}
    >
      <circle r={r} />
      <text dominantBaseline="middle" textAnchor="middle" y="0.5">
        {z === 0 ? '0' : zs(z)}
      </text>
    </g>
  );
}
