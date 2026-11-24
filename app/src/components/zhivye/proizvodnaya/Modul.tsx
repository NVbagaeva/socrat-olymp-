'use client';

import { clsx } from 'clsx';
import { useId, useMemo, useRef } from 'react';
import { MODUL8_T as T } from '@/content/zhivye8';
import { typeset } from '@/lib/tex';
import { prizhat, ru, ruTex } from '@/lib/zhivye/hod';
import { MODUL8 as S, naShkale, proydenoZnacheniy } from '@/lib/zhivye/proizvodnaya8';
import { Podpis, Taymlayn, Upravlenie, klavishi, tex, shirina } from '../Elementy';
import { useDvizhenie, useHod, useShirina } from '../hooks';
import '../zhivye.css';
import './proizvodnaya.css';

/**
 * «У модуля в нуле нет производной»: точка M₁ на графике y = |x| идёт к
 * нулю справа, перескакивает через ноль и уходит влево. Секущая OM₁ справа
 * лежит на правой ветви (наклон 1), слева — на левой (наклон −1); после
 * перехода правая остаётся бледным следом — видно, что к одной прямой
 * секущие не сходятся. Таблица Δx, Δy, Δy/Δx.
 */

export default function Modul() {
  const id = useId().replace(/:/g, '');
  const hod = useHod(S.hod);
  const obertka = useRef<HTMLDivElement>(null);
  const W = useShirina(obertka);
  const dvizhenie = useDvizhenie();
  const { t } = hod.kadr;
  const n = S.shkala.length;
  const dx = naShkale(S.shkala, t);
  const konec = t >= n - 1 - 1e-9;
  const iNol = S.shkala.findIndex((x) => x < 0);

  const dxTex = ruTex(dx, 2);
  const puzyr = tex(T.puzyr(dxTex));
  const shapka = useMemo(
    () => ({ dx: typeset(T.tablica.dx), dy: typeset(T.tablica.dy), otn: typeset(T.tablica.otn) }),
    [],
  );

  let statusTex: string = T.status.start;
  if (konec) statusTex = T.status.konec;
  else if (t > iNol - 1 && t < iNol) statusTex = T.status.nol;
  else if (dx < 0) statusTex = T.status.sleva;
  else if (t > 0 || hod.kadr.igraet) statusTex = T.status.sprava;
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
        ariaValueText={T.ariaPuzyr(ru(dx, 2))}
        metki={[
          { dolya: 0, text: ru(S.shkala[0] as number), proydena: true },
          { dolya: (iNol - 0.5) / (n - 1), text: '0', proydena: t >= iNol - 0.5, akcent: true },
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
        {W > 0 ? <Svg id={id} W={W} dx={dx} bylSprava={t > 0} bylSleva={t >= iNol} /> : null}
      </div>

      <p className="zv-status" aria-live="polite" dangerouslySetInnerHTML={{ __html: status }} />
      <Upravlenie hod={hod} T={T.upravlenie} konec={konec} />

      <table className="zv-tablica zv8-tablica-modul">
        <caption>{T.tablica.caption}</caption>
        <thead>
          <tr>
            <th scope="col" dangerouslySetInnerHTML={{ __html: shapka.dx }} />
            <th scope="col" dangerouslySetInnerHTML={{ __html: shapka.dy }} />
            <th scope="col" dangerouslySetInnerHTML={{ __html: shapka.otn }} />
          </tr>
        </thead>
        <tbody>
          {S.shkala.map((v, i) => {
            const est = i < proydeno;
            const r = S.stroka(v);
            return (
              <tr
                key={v}
                className={clsx(est && 'is-est', v < 0 && 'is-akcent', i === iNol && 'zv8-razryv')}
              >
                <th scope="row">{ru(v, 2)}</th>
                <td>{est ? ru(r.dy, 2) : '—'}</td>
                <td>{est ? ru(r.otn, 0) : '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ── SVG ── */

function Svg({
  id,
  W,
  dx,
  bylSprava,
  bylSleva,
}: {
  id: string;
  W: number;
  dx: number;
  bylSprava: boolean;
  bylSleva: boolean;
}) {
  const H = Math.round(Math.min(380, Math.max(260, W * 0.6)));
  const o = S.okno;
  const pad = { l: 16, r: 16, t: 14, b: 26 };
  const u = Math.min(
    (W - pad.l - pad.r) / (o.xmax - o.xmin),
    (H - pad.t - pad.b) / (o.ymax - o.ymin),
  );
  const shir = u * (o.xmax - o.xmin);
  const left = pad.l + (W - pad.l - pad.r - shir) / 2;
  const X = (x: number) => left + (x - o.xmin) * u;
  const Y = (y: number) => H - pad.b - (y - o.ymin) * u;

  const vidnaM1 = Math.abs(dx) > 0.03;
  const k = dx >= 0 ? 1 : -1;
  const lin = (kk: number) => ({
    x1: X(o.xmin),
    y1: Y(kk * o.xmin),
    x2: X(o.xmax),
    y2: Y(kk * o.xmax),
  });
  const M1 = { x: X(dx), y: Y(Math.abs(dx)) };
  const otnText = T.svgOtn(ru(k, 0));
  const otnX = prizhat(
    M1.x + (k > 0 ? 1 : -1) * (shirina(otnText) / 2 + 16),
    shirina(otnText) + 14,
    pad.l,
    W - pad.r,
  );

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
          <rect x={X(o.xmin)} y={Y(o.ymax)} width={shir} height={(o.ymax - o.ymin) * u} />
        </clipPath>
      </defs>
      {[-2, -1, 0, 1, 2].map((x) => (
        <line
          key={`x${x}`}
          className="zv-setka"
          x1={X(x)}
          x2={X(x)}
          y1={Y(o.ymin)}
          y2={Y(o.ymax)}
        />
      ))}
      {[0, 1, 2].map((y) => (
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
      {[-2, -1, 1, 2].map((x) => (
        <text key={x} className="zv-chislo" x={X(x)} y={Y(0) + 17} textAnchor="middle">
          {ru(x, 0)}
        </text>
      ))}

      <g clipPath={`url(#${id}-pole)`}>
        {/* Следы: секущие справа и слева, которые уже были. */}
        {bylSprava && dx < 0 ? <line className="zv8-sled" {...lin(1)} /> : null}
        {bylSleva && dx > 0 ? <line className="zv8-sled" {...lin(-1)} /> : null}
        <polyline
          className="zv8-krivaya"
          points={`${X(-2.5)},${Y(2.5)} ${X(0)},${Y(0)} ${X(2.5)},${Y(2.5)}`}
        />
        {vidnaM1 ? (
          <>
            <line className="zv8-sekushchaya-svet" {...lin(k)} />
            <line className="zv8-sekushchaya" {...lin(k)} />
          </>
        ) : null}
      </g>
      {bylSprava && dx < 0 ? (
        <Podpis x={X(1.9)} y={Y(1.9) + 22} text={T.svgSprava} klass="is-sin" />
      ) : null}
      <circle className="zv8-tochka-m" cx={X(0)} cy={Y(0)} r="6" />
      <text className="zv8-bukva" x={X(0) + 10} y={Y(0) + 20}>
        O
      </text>
      {vidnaM1 ? (
        <>
          <circle className="zv8-tochka-m1" cx={M1.x} cy={M1.y} r="6" />
          <Podpis x={otnX} y={M1.y - 22} text={otnText} klass="is-zhar" />
        </>
      ) : null}
    </svg>
  );
}
