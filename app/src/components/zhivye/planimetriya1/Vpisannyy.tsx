'use client';

import { clsx } from 'clsx';
import { useMemo, useRef } from 'react';
import { VPISANNYY1 as T } from '@/content/zhivye1';
import { hodVp, naKruge, napravlenie, OSTANOVKI_VP, vp, type T2 } from '@/lib/zhivye/planimetriya1';
import { Podpis, Taymlayn, Upravlenie, klavishi, tex } from '../Elementy';
import { useDvizhenie, useHod, useShirina } from '../hooks';
import '../zhivye.css';
import './planimetriya1.css';

/**
 * «Вписанный угол — половина центрального» (справочник №1): точка C
 * идёт по большой дуге, угол ACB не меняется; затем дуга AB растёт до
 * полуокружности — угол становится прямым. Модель —
 * lib/zhivye/planimetriya1.ts.
 */

export default function Vpisannyy() {
  const o = useMemo(() => hodVp(), []);
  const hod = useHod(o);
  const obertka = useRef<HTMLDivElement>(null);
  const W = useShirina(obertka);
  const dvizhenie = useDvizhenie();
  const { t } = hod.kadr;
  const konec = t >= 3 - 1e-9;
  const s = vp(t);
  const g = (x: number) => String(Math.round(x));

  let status = T.status.start;
  if (konec) status = T.status.konec;
  else if (Math.abs(t - 2) < 1e-6) status = T.status.itog1;
  else if (t > 2) status = T.status.rastet(g(s.centralnyy), g(s.vpisannyy));
  else if (t > 1e-9 || hod.kadr.igraet) {
    status =
      s.centr === 'na-storone'
        ? T.status.naStorone
        : s.centr === 'vnutri'
          ? T.status.vnutri
          : T.status.vne;
  }

  return (
    <div
      className="zv-osnova"
      onKeyDown={klavishi(hod, {
        shag: 0.25,
        shagShift: 1,
        tMax: 3,
        okruglit: (x) => Math.round(x * 4) / 4,
      })}
    >
      <Taymlayn
        dolya={t / 3}
        strelka={(t / 3) * 360}
        puzyrHtml={tex(T.puzyr(g(s.vpisannyy)))}
        ariaLabel={T.ariaVremya}
        ariaValueText={T.ariaPuzyr(g(s.vpisannyy))}
        metki={[
          { dolya: 0, text: T.metkaStart, proydena: true },
          { dolya: 1, text: T.metkaDiametr, proydena: konec },
        ]}
        tochki={OSTANOVKI_VP.map((x) => ({ dolya: x / 3, proydena: t >= x - 1e-9 }))}
        onDolya={(d) => hod.peremotat(d * 3)}
      />
      <div
        ref={obertka}
        className={clsx('zv-scena', `is-${dvizhenie}`)}
        tabIndex={0}
        role="group"
        aria-label={`${T.zag}. ${T.upravlenie.klaviatura}`}
      >
        {W > 0 ? <Svg W={W} t={t} /> : null}
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

/** Сектор-клин из v радиуса r от угла ot до do (против часовой), в пикселях. */
export function klinPath(v: [number, number], r: number, ot: number, doG: number): string {
  const a1 = (ot * Math.PI) / 180;
  const a2 = (doG * Math.PI) / 180;
  const p1 = [v[0] + r * Math.cos(a1), v[1] - r * Math.sin(a1)];
  const p2 = [v[0] + r * Math.cos(a2), v[1] - r * Math.sin(a2)];
  const bolshoy = (doG - ot + 360) % 360 > 180 ? 1 : 0;
  return `M${v[0].toFixed(1)} ${v[1].toFixed(1)} L${p1[0]!.toFixed(1)} ${p1[1]!.toFixed(1)} A${r} ${r} 0 ${bolshoy} 0 ${p2[0]!.toFixed(1)} ${p2[1]!.toFixed(1)} Z`;
}

function Svg({ W, t }: { W: number; t: number }) {
  const H = Math.min(380, Math.max(300, W * 0.62));
  const R = Math.min(H / 2 - 40, W / 2 - 70);
  const c = { x: W / 2, y: H / 2 + 4 };
  const P = (p: T2): [number, number] => [c.x + p[0] * R, c.y - p[1] * R];
  const s = vp(t);
  const A = naKruge(s.a);
  const B = naKruge(s.b);
  const C = naKruge(s.c);
  const [ax, ay] = P(A);
  const [bx, by] = P(B);
  const [cx, cy] = P(C);
  const g = (x: number) => String(Math.round(x));

  /* Дуга AB, на которую опираются углы (против часовой от A до B). */
  const dugaAB = (() => {
    const bol = s.b - s.a > 180 ? 1 : 0;
    return `M${ax} ${ay} A${R} ${R} 0 ${bol} 0 ${bx} ${by}`;
  })();
  /* Вписанный угол: от луча CB к лучу CA (против часовой). */
  const dCA = napravlenie(C, A);
  const dCB = napravlenie(C, B);
  /* Меньший из двух секторов между лучами CB и CA. */
  const odin = (dCA - dCB + 360) % 360;
  const ot = odin <= 180 ? dCB : dCA;
  const doG = ot + (odin <= 180 ? odin : 360 - odin);
  const sred = ((ot + doG) / 2) * (Math.PI / 180);
  const sredO = (((s.a + s.b) / 2) * Math.PI) / 180;
  const pryamoy = Math.abs(s.vpisannyy - 90) < 0.5;
  const podpisLeft = (x: number, w: number) => Math.max(w / 2 + 4, Math.min(W - w / 2 - 4, x));
  const tVp = T.svgVpisannyy(g(s.vpisannyy));
  const tCe = T.svgCentralnyy(g(s.centralnyy));

  return (
    <svg
      className="zv-svg"
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={T.alt}
    >
      <circle className="zv1-okr" cx={c.x} cy={c.y} r={R} />
      <path className="zv1-duga" d={dugaAB} />
      {/* Центральный угол. */}
      <path className="zv1-klin-o" d={klinPath([c.x, c.y], R * 0.28, s.a, s.b)} />
      <line className="zv1-radius" x1={c.x} y1={c.y} x2={ax} y2={ay} />
      <line className="zv1-radius" x1={c.x} y1={c.y} x2={bx} y2={by} />
      {/* Вписанный угол. */}
      <path
        className={clsx('zv1-klin-c', pryamoy && 'is-pryamoy')}
        d={klinPath([cx, cy], R * 0.3, ot, doG)}
      />
      <line className="zv1-storona" x1={cx} y1={cy} x2={ax} y2={ay} />
      <line className="zv1-storona" x1={cx} y1={cy} x2={bx} y2={by} />
      <circle className="zv1-tochka-o" cx={c.x} cy={c.y} r="4" />
      <text className="zv1-bukva" x={c.x + 8} y={c.y + 18}>
        O
      </text>
      {(
        [
          ['A', A, s.a],
          ['B', B, s.b],
          ['C', C, s.c],
        ] as const
      ).map(([b, p, th]) => {
        const [x, y] = P(p);
        const r = (th * Math.PI) / 180;
        return (
          <g key={b}>
            <circle
              className={clsx('zv1-tochka', b === 'C' && 'is-c')}
              cx={x}
              cy={y}
              r={b === 'C' ? 7 : 5}
            />
            <text
              className="zv1-bukva"
              x={x + 18 * Math.cos(r)}
              y={y - 18 * Math.sin(r) + 5}
              textAnchor="middle"
            >
              {b}
            </text>
          </g>
        );
      })}
      <Podpis
        x={podpisLeft(cx + R * 0.55 * Math.cos(sred), tVp.length * 7.4 + 14)}
        y={Math.max(14, Math.min(H - 14, cy - R * 0.55 * Math.sin(sred)))}
        text={tVp}
        klass="is-zhar"
      />
      <Podpis
        x={podpisLeft(c.x + R * 0.52 * Math.cos(sredO), tCe.length * 7.4 + 14)}
        y={c.y - R * 0.52 * Math.sin(sredO)}
        text={tCe}
        klass="is-sin"
      />
    </svg>
  );
}
