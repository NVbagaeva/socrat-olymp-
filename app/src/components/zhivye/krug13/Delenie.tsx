'use client';

import { clsx } from 'clsx';
import { useMemo, useRef, useState } from 'react';
import { DELENIE13 as T } from '@/content/zhivye13';
import { MAKETY, duga, hodMaketa, ugolText, vidnyeTochki, type Maket } from '@/lib/zhivye/krug13';
import { Taymlayn, Upravlenie, klavishi, tex } from '../Elementy';
import { useDvizhenie, useHod, useShirina } from '../hooks';
import '../zhivye.css';
import './krug13.css';

/**
 * «Как делят окружность на части» (теория №13): три деления — на
 * четверти, пополам, на три части. Тёплая дуга откладывает равные части
 * от точки (1; 0), на окружности появляются точки с углами; объяснение
 * шага — в строке состояния. Заменила прежний KrugDelenie14 (кнопки
 * «Назад/Дальше»). Модель — lib/zhivye/krug13.ts, тексты —
 * content/zhivye13.ts.
 */

export default function Delenie() {
  const [iM, setIM] = useState(0);
  const m = MAKETY[iM] as Maket;
  const o = useMemo(() => hodMaketa(m), [m]);
  const hod = useHod(o);
  const obertka = useRef<HTMLDivElement>(null);
  const W = useShirina(obertka);
  const dvizhenie = useDvizhenie();
  const { t } = hod.kadr;
  const n = m.shagi.length;
  const konec = t >= n - 1 - 1e-9;
  const shag = Math.min(n - 1, Math.floor(t + 1e-9));
  const tekst = T.makety[m.id];
  const tochki = vidnyeTochki(m, t);

  return (
    <div
      className="zv-osnova"
      onKeyDown={klavishi(hod, {
        shag: 1,
        shagShift: 1,
        tMax: n - 1,
        okruglit: (v) => Math.round(v),
      })}
    >
      <div className="zv-seg" role="group" aria-label={T.maket}>
        {MAKETY.map((x, i) => (
          <button
            key={x.id}
            type="button"
            className={clsx(i === iM && 'is-on')}
            aria-pressed={i === iM}
            onClick={() => {
              setIM(i);
              hod.sbros();
            }}
          >
            {T.makety[x.id].title}
          </button>
        ))}
      </div>

      <Taymlayn
        dolya={t / (n - 1)}
        strelka={(t / (n - 1)) * 360}
        puzyrHtml={tex(T.puzyr(shag + 1, n))}
        ariaLabel={T.ariaVremya}
        ariaValueText={T.ariaPuzyr(shag + 1, n)}
        metki={[
          { dolya: 0, text: '1', proydena: true },
          { dolya: 1, text: String(n), proydena: konec },
        ]}
        tochki={Array.from({ length: n - 2 }, (_, i) => ({
          dolya: (i + 1) / (n - 1),
          proydena: t >= i + 1 - 1e-9,
        }))}
        onDolya={(d) => hod.peremotat(d * (n - 1))}
      />

      <div className="zv13-ryad">
        <div
          ref={obertka}
          className={clsx('zv-scena', 'zv13-scena', `is-${dvizhenie}`)}
          tabIndex={0}
          role="group"
          aria-label={`${T.zag}. ${T.upravlenie.klaviatura}`}
        >
          {W > 0 ? <Svg W={W} m={m} t={t} /> : null}
        </div>
        <div className="zv13-tochki">
          <p className="zv13-tochki-zag">{T.tochkiZag}</p>
          <ul>
            {tochki.map(({ tochka: [a, b], novaya }) => (
              <li key={`${a}/${b}`} className={clsx(novaya && 'is-novaya')}>
                {ugolText(a, b)}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p
        className="zv-status"
        aria-live="polite"
        dangerouslySetInnerHTML={{ __html: tex(tekst.shagi[shag] ?? '') }}
      />
      <Upravlenie hod={hod} T={T.upravlenie} konec={konec} />
    </div>
  );
}

function Svg({ W, m, t }: { W: number; m: Maket; t: number }) {
  const S = Math.min(W, 380);
  const c = { x: W / 2, y: S / 2 };
  const R = S * 0.33;
  const P = (a: number, r = R) => ({
    x: c.x + r * Math.cos(a * Math.PI),
    y: c.y - r * Math.sin(a * Math.PI),
  });
  const d = duga(m, t);
  const konecDugi = P(d);
  const dugaPath =
    d > 1e-3
      ? `M${c.x + R} ${c.y} A${R} ${R} 0 ${d > 1 ? 1 : 0} 0 ${konecDugi.x.toFixed(2)} ${konecDugi.y.toFixed(2)}`
      : '';
  const tochki = vidnyeTochki(m, t);
  /* Полный оборот (2π) — дуга во всю окружность: рисуется кругом. */
  const polnyy = d >= 2 - 1e-6;

  return (
    <svg
      className="zv-svg zv13-svg"
      width={W}
      height={S}
      viewBox={`0 0 ${W} ${S}`}
      role="img"
      aria-label={T.alt}
    >
      <path className="zv-os" d={`M${c.x - R * 1.35} ${c.y} H${c.x + R * 1.35}`} />
      <path className="zv-os" d={`M${c.x} ${c.y + R * 1.35} V${c.y - R * 1.35}`} />
      <circle className="zv13-okruzhnost" cx={c.x} cy={c.y} r={R} />
      {/* Деления окружности на равные дуги. */}
      {Array.from({ length: m.delenie }, (_, k) => {
        const a = (2 * k) / m.delenie;
        const p1 = P(a, R - 6);
        const p2 = P(a, R + 6);
        return <line key={k} className="zv13-delenie" x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} />;
      })}
      {polnyy ? (
        <circle className="zv13-duga" cx={c.x} cy={c.y} r={R} />
      ) : dugaPath ? (
        <path className="zv13-duga" d={dugaPath} />
      ) : null}
      {tochki.map(({ tochka: [a, b], novaya }) => {
        const ug = a / b;
        const p = P(ug);
        const l = P(ug, R + 26);
        return (
          <g key={`${a}/${b}`} className={clsx('zv13-tochka-del', novaya && 'is-novaya')}>
            <circle cx={p.x} cy={p.y} r={novaya ? 7 : 5.5} />
            <text x={l.x} y={l.y + 5} textAnchor="middle">
              {ug >= 2 - 1e-9 ? '2π' : ugolText(a, b)}
            </text>
          </g>
        );
      })}
      {d > 1e-3 && !polnyy ? (
        <circle className="zv13-konec-dugi" cx={konecDugi.x} cy={konecDugi.y} r="4" />
      ) : null}
      <circle className="zv13-start" cx={c.x + R} cy={c.y} r="4" />
    </svg>
  );
}
