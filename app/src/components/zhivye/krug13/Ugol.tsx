'use client';

import { clsx } from 'clsx';
import { useRef, type PointerEvent } from 'react';
import { UGOL13 as T } from '@/content/zhivye13';
import { piTex, q } from '@/lib/zadanie14/ugol';
import { ru } from '@/lib/zhivye/hod';
import { HOD_UGLA, UGOL_MAX, oboroty, tochno } from '@/lib/zhivye/krug13';
import { Podpis, Taymlayn, Upravlenie, klavishi, tex } from '../Elementy';
import { useDvizhenie, useHod, useShirina } from '../hooks';
import '../zhivye.css';
import './krug13.css';

/**
 * «Угол, обороты и координаты точки» (теория №13): точка идёт по единичной
 * окружности от 0 до 13π/3; проекции на оси — косинус (тёплая) и синус
 * (синяя), спираль пути внутри круга показывает число оборотов. Снимки —
 * на четвертях первого оборота и в конце второго. Точку можно тащить:
 * угол выбирается ближайший к текущему, с учётом оборотов. Заменила
 * прежний KrugZhivoy14. Модель — lib/zhivye/krug13.ts.
 */

const SHAG = 1 / 12;

function xTex(xPi: number): string {
  const k = Math.round(xPi * 12);
  if (Math.abs(xPi * 12 - k) < 0.01) return `= ${piTex(q(k, 12))}`;
  return `\\approx${ru(xPi, 2).replace(',', '{,}')}\\pi`;
}

function chisloTex(x: number): string {
  return ru(Math.abs(x) < 5e-4 ? 0 : x, 3)
    .replace(',', '{,}')
    .replace('−', '-');
}

export default function Ugol() {
  const hod = useHod(HOD_UGLA);
  const obertka = useRef<HTMLDivElement>(null);
  const W = useShirina(obertka);
  const dvizhenie = useDvizhenie();
  const { t } = hod.kadr;
  const konec = t >= UGOL_MAX - 1e-9;
  const k12 = Math.round(t * 12);
  const kratnyy = Math.abs(t * 12 - k12) < 0.01;
  const ex = kratnyy ? tochno(k12 / 12) : null;
  const { n: nOb, ostatok } = oboroty(t);
  const gradusy = Math.round(t * 180);
  const cosT = ex ? ex.cos : chisloTex(Math.cos(t * Math.PI));
  const sinT = ex ? ex.sin : chisloTex(Math.sin(t * Math.PI));

  const naSnimke =
    HOD_UGLA.ostanovki.some((s) => Math.abs(s - t) < 1e-6) &&
    (hod.kadr.snimokIdet || !hod.kadr.igraet);
  let statusTex = T.status.start;
  if (konec) statusTex = T.status.konec;
  else if (naSnimke && Math.abs(t - Math.round(t / 2) * 2) < 1e-6 && t > 0)
    statusTex = T.status.oborot(Math.round(t / 2));
  else if (naSnimke) statusTex = T.status.chetvert(piTex(q(k12, 12)), cosT, sinT);
  else if (t > 0 || hod.kadr.igraet) statusTex = T.status.idet;

  const razlozhenie =
    nOb > 0 && kratnyy ? ` = ${piTex(q(2 * nOb))}+${piTex(q(Math.round(ostatok * 12), 12))}` : '';

  return (
    <div
      className="zv-osnova"
      onKeyDown={klavishi(hod, {
        shag: SHAG,
        shagShift: 0.5,
        tMax: UGOL_MAX,
        okruglit: (v) => Math.round(v * 12) / 12,
      })}
    >
      <Taymlayn
        dolya={t / UGOL_MAX}
        strelka={t * 180}
        puzyrHtml={tex(T.puzyr(xTex(t)))}
        ariaLabel={T.ariaVremya}
        ariaValueText={T.ariaPuzyr(gradusy)}
        metki={[0, 1, 2, 3, 4].map((m) => ({
          dolya: m / UGOL_MAX,
          text: m === 0 ? '0' : m === 1 ? 'π' : `${m}π`,
          proydena: t >= m - 1e-9,
          akcent: m === 2 || m === 4,
        }))}
        tochki={HOD_UGLA.ostanovki.map((s) => ({ dolya: s / UGOL_MAX, proydena: t >= s - 1e-9 }))}
        onDolya={(d) => hod.peremotat(d * UGOL_MAX)}
      />

      <div className="zv13-ryad">
        <div
          ref={obertka}
          className={clsx('zv-scena', 'zv13-scena', `is-${dvizhenie}`)}
          tabIndex={0}
          role="group"
          aria-label={`${T.zag}. ${T.upravlenie.klaviatura}`}
        >
          {W > 0 ? (
            <Svg
              W={W}
              t={t}
              cosText={ex ? null : ru(Math.cos(t * Math.PI), 2)}
              sinText={ex ? null : ru(Math.sin(t * Math.PI), 2)}
              peremotat={hod.peremotat}
            />
          ) : null}
        </div>
        <dl className="zv13-dannye" aria-live="off">
          <div>
            <dt>{T.ugol}</dt>
            <dd dangerouslySetInnerHTML={{ __html: tex(`$x ${xTex(t)}${razlozhenie}$`) }} />
            <dd className="zv13-gradusy">{T.gradusy(gradusy)}</dd>
          </div>
          <div>
            <dt>{T.oborotov}</dt>
            <dd className={clsx('zv13-oboroty', nOb > 0 && 'is-akcent')}>{nOb}</dd>
          </div>
          <div className="is-zhar">
            <dt>{T.abscissa}</dt>
            <dd dangerouslySetInnerHTML={{ __html: tex(`$\\cos x=${cosT}$`) }} />
          </div>
          <div className="is-sin">
            <dt>{T.ordinata}</dt>
            <dd dangerouslySetInnerHTML={{ __html: tex(`$\\sin x=${sinT}$`) }} />
          </div>
        </dl>
      </div>

      <p
        className="zv-status"
        aria-live="polite"
        dangerouslySetInnerHTML={{ __html: tex(statusTex) }}
      />
      <Upravlenie hod={hod} T={T.upravlenie} konec={konec} />
    </div>
  );
}

function Svg({
  W,
  t,
  cosText,
  sinText,
  peremotat,
}: {
  W: number;
  t: number;
  cosText: string | null;
  sinText: string | null;
  peremotat: (t: number) => void;
}) {
  const S = Math.min(W, 380);
  const c = { x: W / 2, y: S / 2 };
  const R = S * 0.34;
  const th = t * Math.PI;
  const P = { x: c.x + R * Math.cos(th), y: c.y - R * Math.sin(th) };
  const tashchu = useRef(false);

  const izSobytiya = (e: PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const dx = e.clientX - r.left - c.x;
    const dy = e.clientY - r.top - c.y;
    let a = Math.atan2(-dy, dx) / Math.PI;
    const k = Math.round(a * 12);
    if (Math.abs(a * 12 - k) < 0.2) a = k / 12;
    let d = a - t;
    d -= 2 * Math.round(d / 2);
    peremotat(Math.min(UGOL_MAX, Math.max(0, t + d)));
  };

  /* Спираль пути: радиус растёт с каждым оборотом. */
  const spiral: string[] = [];
  const N = Math.max(2, Math.round(t * 60));
  for (let i = 0; i <= N; i += 1) {
    const a = (t * Math.PI * i) / N;
    const rr = R * (0.18 + (0.1 * a) / (2 * Math.PI));
    spiral.push(`${(c.x + rr * Math.cos(a)).toFixed(1)},${(c.y - rr * Math.sin(a)).toFixed(1)}`);
  }
  const koordinaty = cosText !== null && sinText !== null ? `(${cosText}; ${sinText})` : null;

  return (
    <svg
      className="zv-svg zv13-svg"
      width={W}
      height={S}
      viewBox={`0 0 ${W} ${S}`}
      role="img"
      aria-label={T.alt}
      onPointerDown={(e) => {
        tashchu.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        izSobytiya(e);
      }}
      onPointerMove={(e) => {
        if (tashchu.current) izSobytiya(e);
      }}
      onPointerUp={() => {
        tashchu.current = false;
      }}
    >
      <path
        className="zv-os"
        d={`M${c.x - R * 1.35} ${c.y} H${c.x + R * 1.35} m-6 -4 l6 4 l-6 4`}
      />
      <path className="zv-os" d={`M${c.x} ${c.y + R * 1.35} V${c.y - R * 1.35} m-4 6 l4 -6 l4 6`} />
      <text className="zv13-os-podpis is-zhar" x={c.x + R * 1.35} y={c.y + 20} textAnchor="end">
        {T.svgCos}
      </text>
      <text className="zv13-os-podpis is-sin" x={c.x + 10} y={c.y - R * 1.3}>
        {T.svgSin}
      </text>
      <circle className="zv13-okruzhnost" cx={c.x} cy={c.y} r={R} />
      {[1, -1].map((v) => (
        <g key={v}>
          <text
            className="zv-chislo"
            x={c.x + v * R + (v > 0 ? 6 : -6)}
            y={c.y + 17}
            textAnchor={v > 0 ? 'start' : 'end'}
          >
            {ru(v, 0)}
          </text>
          <text className="zv-chislo" x={c.x - 8} y={c.y - v * R - 6} textAnchor="end">
            {ru(v, 0)}
          </text>
        </g>
      ))}
      {spiral.length > 1 && t > 0.01 ? (
        <polyline className="zv13-spiral" points={spiral.join(' ')} />
      ) : null}
      {/* Проекции: косинус по оси абсцисс, синус по оси ординат. */}
      <line className="zv13-proekciya" x1={P.x} x2={P.x} y1={P.y} y2={c.y} />
      <line className="zv13-proekciya" x1={P.x} x2={c.x} y1={P.y} y2={P.y} />
      <line className="zv13-cos" x1={c.x} x2={P.x} y1={c.y} y2={c.y} />
      <line className="zv13-sin" x1={c.x} x2={c.x} y1={c.y} y2={P.y} />
      <line className="zv13-radius" x1={c.x} y1={c.y} x2={P.x} y2={P.y} />
      <circle className="zv13-ruchka" cx={P.x} cy={P.y} r="14" />
      <circle className="zv13-tochka" cx={P.x} cy={P.y} r="7" />
      {koordinaty ? (
        <Podpis
          x={Math.min(W - 60, Math.max(60, P.x + (Math.cos(th) >= 0 ? 52 : -52)))}
          y={P.y + (Math.sin(th) >= 0 ? -20 : 22)}
          text={koordinaty}
        />
      ) : null}
    </svg>
  );
}
