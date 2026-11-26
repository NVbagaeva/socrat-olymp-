'use client';

import { clsx } from 'clsx';
import { useMemo, useRef, useState } from 'react';
import { KREDIT16 as T } from '@/content/zhivye16';
import { ru, ruTex } from '@/lib/zhivye/hod';
import {
  PLATEZH,
  hodKredita,
  itogo,
  kredit,
  sostoyanie,
  type God,
  type Kredit as KreditT,
  type Shema,
} from '@/lib/zhivye/kredit16';
import { Podpis, Taymlayn, Upravlenie, klavishi, tex } from '../Elementy';
import { useDvizhenie, useHod, useShirina } from '../hooks';
import '../zhivye.css';
import './kredit16.css';

/**
 * «Как гасится кредит» (теория №16): столбик долга растёт на 10 %,
 * платёж срезает с него кусок — проценты и часть долга — и кусок
 * уезжает в столбик своего года. Две схемы: дифференцированная и
 * аннуитетная. Модель — lib/zhivye/kredit16.ts.
 */

export default function Kredit() {
  const [shema, setShema] = useState<Shema>('dif');
  const k = useMemo(() => kredit(shema), [shema]);
  const o = useMemo(() => hodKredita(k), [k]);
  const hod = useHod(o);
  const obertka = useRef<HTMLDivElement>(null);
  const W = useShirina(obertka);
  const dvizhenie = useDvizhenie();
  const { t } = hod.kadr;
  const konec = t >= k.n - 1e-9;
  const st = sostoyanie(k, t);
  const usl = T.usloviya[shema];
  const v = (x: number) => ruTex(x, 2);

  let status = T.status.start(usl.tex);
  const tseloe = Math.abs(t - Math.round(t)) < 1e-6;
  if (konec) {
    const { vsego, pereplata } = itogo(k);
    status = (shema === 'dif' ? T.status.konecDif : T.status.konecAnn)(v(vsego), v(pereplata));
  } else if (t > 1e-9 || hod.kadr.igraet) {
    const nomer = tseloe ? Math.round(t) : st.god + 1;
    const g = k.gody[nomer - 1] as God | undefined;
    if (g !== undefined && (tseloe || st.u >= PLATEZH)) {
      status = T.status.god(nomer, v(g.platezh), v(g.procenty), v(g.osnovnoy), v(g.ostatok));
    } else {
      const g0 = k.gody[st.god] as God;
      status = T.status.nachislenie(st.god + 1, v(g0.dolg), v(g0.procenty));
    }
  }

  const puzyr = konec
    ? T.puzyrKonec
    : t < 1e-9
      ? T.puzyrStart
      : T.puzyr(
          tseloe ? Math.round(t) : st.god + 1,
          !tseloe && st.u < PLATEZH ? T.puzyrNachislenie : T.puzyrPlatezh,
        );

  return (
    <div
      className="zv-osnova"
      onKeyDown={klavishi(hod, {
        shag: 1,
        shagShift: 1,
        tMax: k.n,
        okruglit: (x) => Math.round(x),
      })}
    >
      <div className="zv16-vybor">
        <span className="zv16-vybor-zag">{T.shema}</span>
        <div className="zv-seg" role="group" aria-label={T.shema}>
          {(['dif', 'ann'] as const).map((s) => (
            <button
              key={s}
              type="button"
              className={clsx(shema === s && 'is-on')}
              aria-pressed={shema === s}
              onClick={() => {
                setShema(s);
                hod.sbros();
              }}
            >
              {T[s]}
            </button>
          ))}
        </div>
      </div>

      <Taymlayn
        dolya={t / k.n}
        strelka={(t / k.n) * 360}
        puzyrHtml={tex(puzyr)}
        ariaLabel={T.ariaVremya}
        ariaValueText={puzyr}
        metki={Array.from({ length: k.n + 1 }, (_, i) => ({
          dolya: i / k.n,
          text: String(i),
          proydena: t >= i - 1e-9,
        }))}
        tochki={Array.from({ length: k.n - 1 }, (_, i) => ({
          dolya: (i + 1) / k.n,
          proydena: t >= i + 1 - 1e-9,
        }))}
        onDolya={(d) => hod.peremotat(d * k.n)}
      />

      <div
        ref={obertka}
        className={clsx('zv-scena', `is-${dvizhenie}`)}
        tabIndex={0}
        role="group"
        aria-label={`${T.zag}. ${T.upravlenie.klaviatura}`}
      >
        {W > 0 ? <Svg W={W} k={k} t={t} edinica={usl.edinica} /> : null}
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

/* ── SVG ── */

function Svg({ W, k, t, edinica }: { W: number; k: KreditT; t: number; edinica: string }) {
  const uzko = W < 560;
  const H = uzko ? 320 : 360;
  const osY = H - 44;
  const verh = 46;
  const maxV = Math.max(...k.gody.map((g) => g.posleProcentov));
  const h = (x: number) => ((osY - verh) * x) / maxV;
  const st = sostoyanie(k, t);
  const fmt = (x: number) => ru(x, 2);

  /* Столбик долга слева, столбики платежей справа. */
  const bw = uzko ? 62 : 96;
  const bx = uzko ? 14 : 28;
  const c0 = bx + bw + (uzko ? 30 : 64);
  const c1 = W - (uzko ? 8 : 24);
  const step = (c1 - c0) / k.n;
  const cw = Math.min(uzko ? 46 : 76, step * 0.68);
  const cx = (i: number) => c0 + step * i + (step - cw) / 2;

  const g = k.gody[st.god] as God;
  const edet = st.edet > 0 && st.edet < 1 && t < k.n - 1e-9;
  /* Кусок платежа в пути: от верха столбика долга к своему столбику. */
  const kusok = (() => {
    if (!edet) return null;
    const e = st.edet;
    const x = bx + (cx(st.god) - bx) * e;
    const w = bw + (cw - bw) * e;
    const nizOt = osY - h(g.ostatok);
    const y = nizOt + (osY - nizOt) * e;
    return { x, w, y };
  })();

  return (
    <svg
      className="zv-svg"
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={T.alt}
    >
      <path className="zv-os" d={`M${bx - 6} ${osY} H${W - 4}`} />

      {/* Долг: синяя часть и оранжевая шапка начисленных процентов. */}
      {(() => {
        if (t >= k.n - 1e-9) return null;
        if (st.edet > 0) {
          return (
            <rect
              className="zv16-dolg"
              x={bx}
              y={osY - h(g.ostatok)}
              width={bw}
              height={h(g.ostatok)}
              rx="6"
            />
          );
        }
        const p = g.procenty * st.nachisleno;
        return (
          <g>
            <rect
              className="zv16-dolg"
              x={bx}
              y={osY - h(g.dolg)}
              width={bw}
              height={h(g.dolg)}
              rx="6"
            />
            {p > 0 ? (
              <rect
                className="zv16-procenty is-rastet"
                x={bx}
                y={osY - h(g.dolg + p)}
                width={bw}
                height={h(p)}
                rx="4"
              />
            ) : null}
            {/* Граница будущего платежа — пунктир, когда проценты начислены. */}
            {st.nachisleno >= 1 ? (
              <line
                className="zv16-rez"
                x1={bx - 6}
                x2={bx + bw + 6}
                y1={osY - h(g.ostatok)}
                y2={osY - h(g.ostatok)}
              />
            ) : null}
          </g>
        );
      })()}
      {kusok !== null ? <Stolbik x={kusok.x} y={kusok.y} w={kusok.w} g={g} h={h} edet /> : null}
      <Podpis
        x={bx + bw / 2}
        y={Math.max(14, osY - h(st.dolg) - 16)}
        text={fmt(st.dolg)}
        klass="is-sin"
      />
      <text className="zv16-podpis-osi" x={bx + bw / 2} y={osY + 20} textAnchor="middle">
        {T.svgDolg}
      </text>
      <text className="zv16-edinica" x={bx + bw / 2} y={osY + 36} textAnchor="middle">
        {edinica}
      </text>

      {/* Столбики платежей. */}
      {k.gody.map((gg, i) => {
        const gotov = i < st.gotovo || t >= k.n - 1e-9;
        return (
          <g key={i}>
            <rect className="zv16-mesto" x={cx(i)} y={verh} width={cw} height={osY - verh} rx="6" />
            {gotov ? (
              <Stolbik x={cx(i)} y={osY} w={cw} g={gg} h={h} podpis={fmt(gg.platezh)} />
            ) : null}
            <text className="zv16-podpis-osi" x={cx(i) + cw / 2} y={osY + 20} textAnchor="middle">
              {uzko ? `${i + 1}` : T.svgGod(i + 1)}
            </text>
          </g>
        );
      })}
      <text className="zv16-edinica" x={(c0 + c1) / 2} y={osY + 36} textAnchor="middle">
        {T.svgPlatezhi}
      </text>

    </svg>
  );
}

/** Платёж столбиком: снизу часть долга, сверху проценты; низ — в y. */
function Stolbik({
  x,
  y,
  w,
  g,
  h,
  podpis,
  edet,
}: {
  x: number;
  y: number;
  w: number;
  g: God;
  h: (v: number) => number;
  podpis?: string;
  edet?: boolean;
}) {
  const ho = h(g.osnovnoy);
  const hp = h(g.procenty);
  return (
    <g className={clsx('zv16-stolbik', edet && 'is-edet')}>
      <rect className="zv16-dolg" x={x} y={y - ho} width={w} height={ho} rx="4" />
      <rect className="zv16-procenty" x={x} y={y - ho - hp} width={w} height={hp} rx="4" />
      {podpis === undefined ? null : (
        <text className="zv16-platezh" x={x + w / 2} y={y - ho - hp - 8} textAnchor="middle">
          {podpis}
        </text>
      )}
    </g>
  );
}
