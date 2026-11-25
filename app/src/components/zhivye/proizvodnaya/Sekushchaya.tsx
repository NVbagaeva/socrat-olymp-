'use client';

import { clsx } from 'clsx';
import { useId, useMemo, useRef } from 'react';
import { SEKUSHCHAYA8 as T } from '@/content/zhivye8';
import { typeset } from '@/lib/tex';
import { ru, ruTex } from '@/lib/zhivye/hod';
import { SEKUSHCHAYA as S, naShkale, proydenoZnacheniy } from '@/lib/zhivye/proizvodnaya8';
import { Podpis, Taymlayn, Upravlenie, klavishi, tex, shirina } from '../Elementy';
import { useDvizhenie, useHod, useShirina } from '../hooks';
import '../zhivye.css';
import './proizvodnaya.css';

/**
 * «Секущая поворачивается к касательной»: точка M₁ скользит по графику
 * к M, секущая MM₁ (тёплая) поворачивается и ложится на касательную
 * (пунктир). Треугольник приращений Δx, Δf; лупа у точки M показывает
 * вблизи, что секущая и касательная сливаются. Таблица Δx, Δf, tg β
 * заполняется на каждом значении шкалы. Модель — lib/zhivye/proizvodnaya8.ts.
 */

function dxText(dx: number): string {
  return ru(dx, Math.abs(dx) < 0.1 ? 3 : 2);
}

export default function Sekushchaya() {
  const id = useId().replace(/:/g, '');
  const hod = useHod(S.hod);
  const obertka = useRef<HTMLDivElement>(null);
  const W = useShirina(obertka);
  const dvizhenie = useDvizhenie();
  const { t } = hod.kadr;
  const n = S.shkala.length;
  const dx = naShkale(S.shkala, t);
  const konec = t >= n - 1 - 1e-9;
  const naZnachenii =
    Math.abs(t - Math.round(t)) < 1e-6 && (hod.kadr.snimokIdet || !hod.kadr.igraet);

  const puzyr = tex(T.puzyr(ruTex(dx, Math.abs(dx) < 0.1 ? 3 : 2)));
  const shapka = useMemo(
    () => ({
      dx: typeset(T.tablica.dx),
      df: typeset(T.tablica.df),
      tg: typeset(T.tablica.tg),
      predel: typeset(T.tablica.predel),
      predelTg: typeset(T.tablica.predelTg),
      itog: typeset(T.itog),
    }),
    [],
  );

  let statusTex: string = T.status.start;
  if (konec) statusTex = T.status.konec;
  else if (naZnachenii && t > 0) {
    const r = S.stroka(S.shkala[Math.round(t)] as number);
    statusTex = T.status.snimok(ruTex(r.dx, 3), ruTex(r.df, 6), ruTex(r.tg, 6));
  } else if (t > 0 || hod.kadr.igraet) statusTex = T.status.idet;
  const status = tex(statusTex);

  const proydeno = hod.kadr.zapuskalsya ? proydenoZnacheniy(t) : 1;

  return (
    <div
      className="zv-osnova"
      onKeyDown={klavishi(hod, {
        shag: 1,
        shagShift: 1,
        tMax: n - 1,
        okruglit: (x) => Math.round(x),
      })}
    >
      <Taymlayn
        dolya={t / (n - 1)}
        strelka={(t / (n - 1)) * 360}
        puzyrHtml={puzyr}
        ariaLabel={T.ariaVremya}
        ariaValueText={T.ariaPuzyr(dxText(dx))}
        metki={[
          { dolya: 0, text: ru(S.shkala[0] as number), proydena: true },
          { dolya: 1, text: ru(S.shkala[n - 1] as number), proydena: konec },
        ]}
        tochki={S.shkala
          .slice(1, -1)
          .map((_, i) => ({ dolya: (i + 1) / (n - 1), proydena: t >= i + 1 - 1e-9 }))}
        onDolya={(d) => hod.peremotat(d * (n - 1))}
      />

      <div
        ref={obertka}
        className={clsx('zv-scena', `is-${dvizhenie}`)}
        tabIndex={0}
        role="group"
        aria-label={`${T.zag}. ${T.upravlenie.klaviatura}`}
      >
        {W > 0 ? <Svg id={id} W={W} dx={dx} /> : null}
      </div>

      <p className="zv-status" aria-live="polite" dangerouslySetInnerHTML={{ __html: status }} />
      <Upravlenie hod={hod} T={T.upravlenie} konec={konec} />

      <div className="zv-niz">
        <table className="zv-tablica">
          <caption>{T.tablica.caption}</caption>
          <thead>
            <tr>
              <th scope="col" dangerouslySetInnerHTML={{ __html: shapka.dx }} />
              <th scope="col" dangerouslySetInnerHTML={{ __html: shapka.df }} />
              <th scope="col" dangerouslySetInnerHTML={{ __html: shapka.tg }} />
            </tr>
          </thead>
          <tbody>
            {S.shkala.map((v, i) => {
              const est = i < proydeno;
              const r = S.stroka(v);
              return (
                <tr key={v} className={clsx(est && 'is-est', i === n - 1 && est && 'is-akcent')}>
                  <th scope="row">{ru(v, 3)}</th>
                  <td>{est ? ru(r.df, 6) : '—'}</td>
                  <td>{est ? ru(r.tg, 6) : '—'}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className={clsx(konec && 'is-est')}>
              <th scope="row" dangerouslySetInnerHTML={{ __html: shapka.predel }} />
              <td dangerouslySetInnerHTML={{ __html: shapka.predel }} />
              <td dangerouslySetInnerHTML={{ __html: konec ? shapka.predelTg : '&nbsp;' }} />
            </tr>
          </tfoot>
        </table>
        <div className={clsx('zv-reshenie', konec && 'is-vidno')} aria-hidden={!konec}>
          <p className="zv-itog" dangerouslySetInnerHTML={{ __html: shapka.itog }} />
        </div>
      </div>
    </div>
  );
}

/* ── SVG ── */

function Svg({ id, W, dx }: { id: string; W: number; dx: number }) {
  const uzko = W < 520;
  const H = Math.round(Math.min(430, Math.max(290, W * 0.66)));
  const o = S.okno;
  const pad = { l: 30, r: 14, t: 14, b: 28 };
  const u = Math.min(
    (W - pad.l - pad.r) / (o.xmax - o.xmin),
    (H - pad.t - pad.b) / (o.ymax - o.ymin),
  );
  const shirinaGr = u * (o.xmax - o.xmin);
  const x0px = pad.l + (W - pad.l - pad.r - shirinaGr) / 2;
  const X = (x: number) => x0px + (x - o.xmin) * u;
  const Y = (y: number) => H - pad.b - (y - o.ymin) * u;

  const M = { x: S.x0, y: S.y0 };
  const M1 = { x: S.x0 + dx, y: S.f(S.x0 + dx) };
  const tg = (M1.y - M.y) / dx;
  const pryamaya = (k: number) => {
    const xa = o.xmin;
    const xb = o.xmax;
    return { x1: X(xa), y1: Y(M.y + k * (xa - M.x)), x2: X(xb), y2: Y(M.y + k * (xb - M.x)) };
  };
  const sek = pryamaya(tg);
  const kas = pryamaya(S.tgAlpha);

  const krivaya: string[] = [];
  for (let i = 0; i <= 120; i += 1) {
    const x = -0.95 + (9.0 * i) / 120;
    const y = S.f(x);
    if (y <= o.ymax) krivaya.push(`${X(x).toFixed(1)},${Y(y).toFixed(1)}`);
  }

  /* Треугольник приращений и подписи — когда он заметен. */
  const katetDx = Math.abs(X(M1.x) - X(M.x));
  const katetDf = Math.abs(Y(M1.y) - Y(M.y));
  const podpisDx = katetDx > 56;
  const podpisDf = katetDf > 30;

  /* Лупа у точки M: увеличенный кусок вокруг M. */
  const R = uzko ? 42 : 56;
  const lupaVidna = dx < 1.5;
  const lupaOp = Math.min(1, Math.max(0, (1.5 - dx) / 0.6));
  const cL = { x: X(0.6), y: Y(8.6) };
  const masshtab = R / 0.5;
  const LX = (x: number) => cL.x + (x - M.x) * masshtab;
  const LY = (y: number) => cL.y - (y - M.y) * masshtab;
  const lupaLin = (k: number) => {
    const d = 0.8;
    return { x1: LX(M.x - d), y1: LY(M.y - k * d), x2: LX(M.x + d), y2: LY(M.y + k * d) };
  };
  const lupaKriv: string[] = [];
  for (let i = 0; i <= 40; i += 1) {
    const x = M.x - 0.8 + (1.6 * i) / 40;
    lupaKriv.push(`${LX(x).toFixed(1)},${LY(S.f(x)).toFixed(1)}`);
  }
  const lsek = lupaLin(tg);
  const lkas = lupaLin(S.tgAlpha);

  const tgText = T.svgTg(ru(tg, 4));

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
          <rect x={X(o.xmin)} y={Y(o.ymax)} width={shirinaGr} height={(o.ymax - o.ymin) * u} />
        </clipPath>
        <clipPath id={`${id}-lupa`}>
          <circle cx={cL.x} cy={cL.y} r={R} />
        </clipPath>
        <radialGradient id={`${id}-lupa-fon`}>
          <stop offset="0" stopColor="var(--chertezh-fon)" stopOpacity="0.96" />
          <stop offset="1" stopColor="var(--chertezh-zalivka-svet)" stopOpacity="0.92" />
        </radialGradient>
      </defs>

      {/* Сетка и оси. */}
      {Array.from({ length: o.xmax - o.xmin + 1 }, (_, i) => o.xmin + i).map((x) => (
        <line
          key={`x${x}`}
          className="zv-setka"
          x1={X(x)}
          x2={X(x)}
          y1={Y(o.ymin)}
          y2={Y(o.ymax)}
        />
      ))}
      {Array.from({ length: o.ymax - o.ymin + 1 }, (_, i) => o.ymin + i).map((y) => (
        <line
          key={`y${y}`}
          className="zv-setka"
          x1={X(o.xmin)}
          x2={X(o.xmax)}
          y1={Y(y)}
          y2={Y(y)}
        />
      ))}
      <path className="zv-os" d={`M${X(o.xmin)} ${Y(0)} H${X(o.xmax) + 6} m-6 -4 l6 4 l-6 4`} />
      <path className="zv-os" d={`M${X(0)} ${Y(o.ymin)} V${Y(o.ymax) - 6} m-4 6 l4 -6 l4 6`} />
      {[2, 4, 6, 8].map((x) => (
        <text key={x} className="zv-chislo" x={X(x)} y={Y(0) + 17} textAnchor="middle">
          {x}
        </text>
      ))}
      {[2, 4, 6, 8, 10].map((y) => (
        <text
          key={y}
          className="zv-chislo"
          x={X(0) - 7}
          y={Y(y)}
          textAnchor="end"
          dominantBaseline="middle"
        >
          {y}
        </text>
      ))}

      <g clipPath={`url(#${id}-pole)`}>
        <polyline className="zv8-krivaya" points={krivaya.join(' ')} />
        <line className="zv8-kasatelnaya" {...kas} />
        <line className="zv8-sekushchaya-svet" {...sek} />
        <line className="zv8-sekushchaya" {...sek} />
        {/* Треугольник приращений M — A — M₁. */}
        <path className="zv8-treugolnik" d={`M${X(M.x)} ${Y(M.y)} H${X(M1.x)} V${Y(M1.y)}`} />
      </g>
      {podpisDx ? (
        <Podpis x={(X(M.x) + X(M1.x)) / 2} y={Y(M.y) + 16} text="Δx" klass="is-zhar" />
      ) : null}
      {podpisDf ? (
        <Podpis x={X(M1.x) + 22} y={(Y(M.y) + Y(M1.y)) / 2} text="Δf" klass="is-zhar" />
      ) : null}

      <text
        className="zv8-bukva-t"
        x={kas.x2 - 8}
        y={Math.max(Y(o.ymax) + 14, kas.y2 + 14)}
        textAnchor="end"
      >
        T
      </text>

      <circle className="zv8-tochka-m" cx={X(M.x)} cy={Y(M.y)} r="6" />
      <text className="zv8-bukva" x={X(M.x) + 2} y={Y(M.y) + 22}>
        M
      </text>
      <circle className="zv8-tochka-m1" cx={X(M1.x)} cy={Y(M1.y)} r="6" />
      {katetDx > 22 ? (
        <text className="zv8-bukva is-zhar" x={X(M1.x) - 10} y={Y(M1.y) - 10} textAnchor="end">
          M₁
        </text>
      ) : null}

      <Podpis
        x={X(o.xmax) - shirina(tgText) / 2 - 10}
        y={Y(o.ymax) + 14}
        text={tgText}
        klass="is-zhar"
      />

      {/* Лупа. */}
      {lupaVidna ? (
        <g className="zv8-lupa" opacity={lupaOp}>
          <line
            className="zv8-lupa-luch"
            x1={cL.x + R * 0.7}
            y1={cL.y + R * 0.7}
            x2={X(M.x) - 8}
            y2={Y(M.y) - 8}
          />
          <circle
            cx={cL.x}
            cy={cL.y}
            r={R}
            fill={`url(#${id}-lupa-fon)`}
            className="zv8-lupa-steklo"
          />
          <g clipPath={`url(#${id}-lupa)`}>
            <polyline className="zv8-krivaya" points={lupaKriv.join(' ')} />
            <line className="zv8-kasatelnaya" {...lkas} />
            <line className="zv8-sekushchaya" {...lsek} />
            <circle className="zv8-tochka-m" cx={cL.x} cy={cL.y} r="4" />
          </g>
          <circle cx={cL.x} cy={cL.y} r={R} className="zv8-lupa-obod" />
          <Podpis x={cL.x} y={cL.y + R - 14} text={T.svgLupa} />
        </g>
      ) : null}
    </svg>
  );
}
