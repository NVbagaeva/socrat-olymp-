'use client';

import { clsx } from 'clsx';
import { useMemo, useRef } from 'react';
import { SKOROST8_T as T } from '@/content/zhivye8';
import { typeset } from '@/lib/tex';
import { prizhat, ru, ruTex } from '@/lib/zhivye/hod';
import { SKOROST8 as S, naShkale, proydenoZnacheniy } from '@/lib/zhivye/proizvodnaya8';
import { Podpis, Taymlayn, Upravlenie, klavishi, tex, shirina } from '../Elementy';
import { useDvizhenie, useHod, useShirina } from '../hooks';
import '../zhivye.css';
import './proizvodnaya.css';

/**
 * «Средняя скорость подходит к мгновенной»: на дороге с отметками в
 * метрах точка M (момент t = 2) и точка M₁ (момент 2 + Δt); путь Δs между
 * ними подсвечен. Над дорогой спидометр: стрелка средней скорости Δs/Δt
 * с уменьшением Δt подходит к отметке 2 м/с. Таблица Δt, Δs, v_ср.
 */

function dtText(dt: number): string {
  return ru(dt, Math.abs(dt) < 0.1 ? 3 : 2);
}

export default function Skorost() {
  const hod = useHod(S.hod);
  const obertka = useRef<HTMLDivElement>(null);
  const W = useShirina(obertka);
  const dvizhenie = useDvizhenie();
  const { t } = hod.kadr;
  const n = S.shkala.length;
  const dt = naShkale(S.shkala, t);
  const konec = t >= n - 1 - 1e-9;
  const naZnachenii =
    Math.abs(t - Math.round(t)) < 1e-6 && (hod.kadr.snimokIdet || !hod.kadr.igraet);

  const dtTex = ruTex(dt, Math.abs(dt) < 0.1 ? 3 : 2);
  const puzyr = tex(T.puzyr(dtTex));
  const shapka = useMemo(
    () => ({
      dt: typeset(T.tablica.dt),
      ds: typeset(T.tablica.ds),
      v: typeset(T.tablica.v),
      predel: typeset(T.tablica.predel),
      predelV: typeset(T.tablica.predelV),
      itog: typeset(T.itog),
    }),
    [],
  );

  let statusTex: string = T.status.start;
  if (konec) statusTex = T.status.konec;
  else if (naZnachenii && t > 0) {
    const r = S.stroka(S.shkala[Math.round(t)] as number);
    statusTex = T.status.snimok(ruTex(r.dt, 3), ruTex(r.ds, 5), ruTex(r.vSr, 4));
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
        ariaValueText={T.ariaPuzyr(dtText(dt))}
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
        {W > 0 ? <Svg W={W} dt={dt} /> : null}
      </div>

      <p className="zv-status" aria-live="polite" dangerouslySetInnerHTML={{ __html: status }} />
      <Upravlenie hod={hod} T={T.upravlenie} konec={konec} />

      <div className="zv-niz">
        <table className="zv-tablica">
          <caption>{T.tablica.caption}</caption>
          <thead>
            <tr>
              <th scope="col" dangerouslySetInnerHTML={{ __html: shapka.dt }} />
              <th scope="col" dangerouslySetInnerHTML={{ __html: shapka.ds }} />
              <th scope="col" dangerouslySetInnerHTML={{ __html: shapka.v }} />
            </tr>
          </thead>
          <tbody>
            {S.shkala.map((v, i) => {
              const est = i < proydeno;
              const r = S.stroka(v);
              return (
                <tr key={v} className={clsx(est && 'is-est', i === n - 1 && est && 'is-akcent')}>
                  <th scope="row">{ru(v, 3)}</th>
                  <td>{est ? ru(r.ds, 5) : '—'}</td>
                  <td>{est ? ru(r.vSr, 4) : '—'}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className={clsx(konec && 'is-est')}>
              <th scope="row" dangerouslySetInnerHTML={{ __html: shapka.predel }} />
              <td dangerouslySetInnerHTML={{ __html: shapka.predel }} />
              <td dangerouslySetInnerHTML={{ __html: konec ? shapka.predelV : '&nbsp;' }} />
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

function Svg({ W, dt }: { W: number; dt: number }) {
  const uzko = W < 520;
  const H = uzko ? 300 : 320;
  const pad = 22;

  /* Спидометр: верхняя полуокружность, 0…4 м/с. */
  const R = uzko ? 78 : 96;
  const c = { x: W / 2, y: R + 26 };
  const ugol = (v: number) => Math.PI + (Math.min(Math.max(v, 0), S.vMax) / S.vMax) * Math.PI;
  const tochkaDugi = (v: number, r: number) => ({
    x: c.x + r * Math.cos(ugol(v)),
    y: c.y + r * Math.sin(ugol(v)),
  });
  const vSr = S.stroka(dt).vSr;
  const igla = tochkaDugi(vSr, R - 14);
  const dugaPath = (a: number, b: number, r: number) => {
    const p = tochkaDugi(a, r);
    const q = tochkaDugi(b, r);
    return `M${p.x.toFixed(1)} ${p.y.toFixed(1)} A${r} ${r} 0 0 1 ${q.x.toFixed(1)} ${q.y.toFixed(1)}`;
  };

  /* Дорога: 0…8 м. */
  const yD = H - 64;
  const x0 = pad + 14;
  const x1 = W - pad - 14;
  const X = (s: number) => x0 + ((x1 - x0) * s) / S.dlina;
  const s0 = S.s(S.t0);
  const s1 = S.s(S.t0 + dt);
  const xM = X(s0);
  const xM1 = X(s1);
  const ds = s1 - s0;
  const dsText = T.svgDs(ru(ds, ds < 0.1 ? 4 : 2));
  const dsX = prizhat((xM + xM1) / 2, shirina(dsText) + 14, pad, W - pad);
  const vText = T.svgV(ru(vSr, 3));

  return (
    <svg
      className="zv-svg"
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={T.alt}
    >
      {/* Спидометр. */}
      <path className="zv8-spidometr-fon" d={`${dugaPath(0, S.vMax, R)}`} />
      <path className="zv8-spidometr-zona" d={dugaPath(0, vSr, R)} />
      {Array.from({ length: S.vMax * 2 + 1 }, (_, i) => i / 2).map((v) => {
        const a = tochkaDugi(v, R - 6);
        const b = tochkaDugi(v, R - (Number.isInteger(v) ? 16 : 11));
        return (
          <line key={v} className="zv8-spidometr-shtrih" x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
        );
      })}
      {Array.from({ length: S.vMax + 1 }, (_, v) => v).map((v) => {
        const p = tochkaDugi(v, R + 13);
        return (
          <text
            key={v}
            className={clsx('zv-chislo', v === S.v && 'zv8-chislo-akcent')}
            x={p.x}
            y={p.y + 4}
            textAnchor="middle"
          >
            {v}
          </text>
        );
      })}
      <line className="zv8-igla" x1={c.x} y1={c.y} x2={igla.x} y2={igla.y} />
      <circle className="zv8-igla-os" cx={c.x} cy={c.y} r="6" />
      <Podpis x={c.x} y={c.y + 22} text={vText} klass="is-zhar" />
      <text className="zv8-spidometr-podpis" x={c.x} y={c.y + 46} textAnchor="middle">
        {T.svgSpidometr}
      </text>

      {/* Дорога. */}
      <rect className="zv8-doroga" x={x0 - 8} y={yD - 7} width={x1 - x0 + 16} height="14" rx="7" />
      {Array.from({ length: S.dlina + 1 }, (_, s) => s).map((s) => (
        <g key={s}>
          <line className="zv8-doroga-shtrih" x1={X(s)} x2={X(s)} y1={yD + 1} y2={yD + 7} />
          <text className="zv-chislo" x={X(s)} y={yD + 24} textAnchor="middle">
            {s}
          </text>
        </g>
      ))}
      <line className="zv8-put" x1={xM} x2={xM1} y1={yD} y2={yD} />
      <circle className="zv8-tochka-m" cx={xM} cy={yD} r="7" />
      <circle className="zv8-tochka-m1" cx={xM1} cy={yD} r="7" />
      <text className="zv8-bukva" x={xM} y={yD - 16} textAnchor="middle">
        M
      </text>
      {xM1 - xM > 22 ? (
        <text className="zv8-bukva is-zhar" x={xM1} y={yD - 16} textAnchor="middle">
          M₁
        </text>
      ) : null}
      <text className="zv8-bukva" x={X(0)} y={yD - 16} textAnchor="middle">
        O
      </text>
      <Podpis x={dsX} y={yD + 48} text={dsText} klass="is-zhar" />
    </svg>
  );
}
