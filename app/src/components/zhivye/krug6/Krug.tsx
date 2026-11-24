'use client';

import { clsx } from 'clsx';
import { useId, useMemo, useRef, useState } from 'react';
import { KRUG6 as T } from '@/content/zhivye6';
import { q, val, type Q } from '@/lib/zadanie11/num';
import { ZNACHENIYA, piTex, serii as serii6, znachTex, type Funkciya } from '@/lib/zadanie7/trig';
import { ru } from '@/lib/zhivye/hod';
import {
  X_MAX,
  X_MIN,
  f as fx,
  hodKruga,
  korni,
  ugolText,
  vKruge,
  znachenie,
  type Koren,
  type Vopros,
} from '@/lib/zhivye/krug6';
import { Podpis, Taymlayn, Upravlenie, klavishi, tex } from '../Elementy';
import { useDvizhenie, useHod, useShirina } from '../hooks';
import '../zhivye.css';
import './krug6.css';

/**
 * «Откуда берутся серии корней» (теория №6): точка обегает единичную
 * окружность от −2π до 2π, справа в том же темпе рисуется график sin, cos
 * или tg. Когда функция равна a, корень «падает» на ось x и отмечается
 * на круге; на каждом корне — пауза-снимок. В конце — серии и нужный
 * корень (наименьший положительный или наибольший отрицательный).
 * Модель — lib/zhivye/krug6.ts, серии — lib/zadanie7/trig.ts.
 */

const FUNKCII: { id: Funkciya; tex: string }[] = [
  { id: 'sin', tex: '\\sin x' },
  { id: 'cos', tex: '\\cos x' },
  { id: 'tg', tex: '\\operatorname{tg}x' },
];

function xTex(xPi: number): string {
  const k = Math.round(xPi * 12);
  if (Math.abs(xPi * 12 - k) < 0.02) return `= ${piTex(q(k, 12))}`;
  return `\\approx${ru(xPi, 2).replace(',', '{,}').replace('−', '-')}\\pi`;
}

function aText(kod: string): string {
  return kod.replace('-', '−').replace(/r(\d)/g, '√$1');
}

export default function Krug() {
  const id = useId().replace(/:/g, '');
  const [fn, setFn] = useState<Funkciya>('sin');
  const [iA, setIA] = useState(3);
  const [vopros, setVopros] = useState<Vopros>('minPol');
  const spisok = ZNACHENIYA[fn];
  const kod = spisok[Math.min(iA, spisok.length - 1)] ?? '0';
  const k = useMemo(() => korni(fn, kod, vopros), [fn, kod, vopros]);
  const o = useMemo(() => hodKruga(k), [k]);
  const hod = useHod(o);
  const obertka = useRef<HTMLDivElement>(null);
  const W = useShirina(obertka);
  const dvizhenie = useDvizhenie();
  const { t } = hod.kadr;
  const tMax = X_MAX - X_MIN;
  const x = t + X_MIN;
  const konec = t >= tMax - 1e-9;
  const fTex = FUNKCII.find((z) => z.id === fn)?.tex ?? '';
  const ur = `${fTex}=${znachTex(kod)}`;

  const proydeny = k.filter((r) => val(r.t) <= x + 1e-9);
  const naKorne = proydeny.find((r) => Math.abs(val(r.t) - x) < 1e-6);
  let statusTex = T.status.start(ur);
  if (konec) statusTex = T.status.konec(k.length);
  else if (naKorne !== undefined && (hod.kadr.snimokIdet || !hod.kadr.igraet))
    statusTex = T.status.koren(ur, piTex(naKorne.t));
  else if (t > 0 || hod.kadr.igraet) statusTex = T.status.idet;

  const pomenyat = (dey: () => void) => {
    dey();
    hod.sbros();
  };

  const nuzhnyy = k.find((r) => r.nuzhnyy);
  const seriiTex = useMemo(() => {
    return tex(`$${ur}$: ` + korniSerii(fn, kod) + ', $n\\in\\mathbb{Z}$.');
  }, [fn, kod, ur]);

  return (
    <div
      className="zv-osnova"
      onKeyDown={klavishi(hod, {
        shag: 1 / 6,
        shagShift: 1 / 2,
        tMax,
        okruglit: (v) => Math.round(v * 6) / 6,
      })}
    >
      {/* Уравнение: функция, значение, вопрос. */}
      <div className="zv6-uravnenie">
        <div className="zv-seg" role="group" aria-label={T.funkciya}>
          {FUNKCII.map((z) => (
            <button
              key={z.id}
              type="button"
              className={clsx(fn === z.id && 'is-on')}
              aria-pressed={fn === z.id}
              onClick={() =>
                pomenyat(() => {
                  setFn(z.id);
                  setIA(Math.min(iA, ZNACHENIYA[z.id].length - 1));
                })
              }
              dangerouslySetInnerHTML={{ __html: tex(`$${z.tex}$`) }}
            />
          ))}
        </div>
        <label className="zv6-a" htmlFor={`${id}-a`}>
          <span dangerouslySetInnerHTML={{ __html: tex(`${T.znachenie}: $a=${znachTex(kod)}$`) }} />
          <input
            id={`${id}-a`}
            type="range"
            min={0}
            max={spisok.length - 1}
            step={1}
            value={Math.min(iA, spisok.length - 1)}
            aria-valuetext={aText(kod)}
            onChange={(e) => {
              const v = Number(e.currentTarget.value);
              pomenyat(() => setIA(v));
            }}
          />
        </label>
        <div className="zv-seg zv-seg--akcent" role="group" aria-label={T.vopros}>
          {(['minPol', 'maxOtr'] as const).map((v) => (
            <button
              key={v}
              type="button"
              className={clsx(vopros === v && 'is-on')}
              aria-pressed={vopros === v}
              onClick={() => pomenyat(() => setVopros(v))}
            >
              {T[v]}
            </button>
          ))}
        </div>
      </div>

      <Taymlayn
        dolya={t / tMax}
        strelka={(x / 2) * 360}
        puzyrHtml={tex(T.puzyr(xTex(x)))}
        ariaLabel={T.ariaVremya}
        ariaValueText={T.ariaPuzyr(`${ru(x, 2)}π`)}
        metki={[-2, -1, 0, 1, 2].map((m) => ({
          dolya: (m - X_MIN) / tMax,
          text: ugolText(q(m)),
          proydena: x >= m - 1e-9,
        }))}
        tochki={k
          .filter((r) => val(r.t) > X_MIN + 1e-9 && val(r.t) < X_MAX - 1e-9)
          .map((r) => ({ dolya: (val(r.t) - X_MIN) / tMax, proydena: x >= val(r.t) - 1e-9 }))}
        onDolya={(d) => hod.peremotat(d * tMax)}
      />

      <div
        ref={obertka}
        className={clsx('zv-scena', `is-${dvizhenie}`)}
        tabIndex={0}
        role="group"
        aria-label={`${T.zag}. ${T.upravlenie.klaviatura}`}
      >
        {W > 0 ? <Svg id={id} W={W} fn={fn} kod={kod} x={x} korni={k} konec={konec} /> : null}
      </div>

      <p
        className="zv-status"
        aria-live="polite"
        dangerouslySetInnerHTML={{ __html: tex(statusTex) }}
      />
      <Upravlenie hod={hod} T={T.upravlenie} konec={konec} />

      <div className="zv6-korni">
        <p className="zv6-korni-zag" dangerouslySetInnerHTML={{ __html: tex(T.korniZag) }} />
        <ul>
          {k.map((r) => {
            const est = val(r.t) <= x + 1e-9;
            return (
              <li
                key={val(r.t)}
                className={clsx(est && 'is-est', konec && r.nuzhnyy && 'is-nuzhnyy')}
                dangerouslySetInnerHTML={{ __html: est ? tex(`$${piTex(r.t)}$`) : '·' }}
              />
            );
          })}
        </ul>
        <div className={clsx('zv-reshenie', konec && 'is-vidno')} aria-hidden={!konec}>
          <p className="zv-itog" dangerouslySetInnerHTML={{ __html: seriiTex }} />
          {nuzhnyy ? (
            <p
              className="zv-itog zv6-nuzhnyy"
              dangerouslySetInnerHTML={{ __html: tex(T.nuzhnyy(T[vopros], piTex(nuzhnyy.t))) }}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** Серии решений: «$x=\dfrac{\pi}{6}+2\pi n$ или $x=…$». */
function korniSerii(fn: Funkciya, kod: string): string {
  return serii6(fn, kod)
    .map((s) => {
      const per = s.per === 1 ? '\\pi n' : `${s.per}\\pi n`;
      return `$x=${s.t0.n === 0 ? per : `${piTex(s.t0)}+${per}`}$`;
    })
    .join(' или ');
}

/* ── SVG ── */

function Svg({
  id,
  W,
  fn,
  kod,
  x,
  korni: k,
  konec,
}: {
  id: string;
  W: number;
  fn: Funkciya;
  kod: string;
  x: number;
  korni: readonly Koren[];
  konec: boolean;
}) {
  const uzko = W < 560;
  const a = znachenie(kod);
  const yMaxG = fn === 'tg' ? Math.max(2.2, Math.abs(a) + 0.7) : 1.4;

  /* Раскладка: на компьютере круг слева, график справа (масштаб общий —
     у синуса точка и график на одной высоте); на телефоне — друг под другом. */
  let H: number;
  let c: { x: number; y: number };
  let R: number;
  let g: { x0: number; x1: number; yc: number; py: number };
  if (uzko) {
    R = Math.min(78, (W - 90) / 2) / (fn === 'tg' ? Math.max(1, (Math.abs(a) + 0.3) / 1.45) : 1);
    c = { x: W / 2, y: R + 30 };
    const gTop = c.y + R + 44;
    const gH = 200;
    H = gTop + gH + 26;
    g = { x0: 20, x1: W - 16, yc: gTop + gH / 2, py: (gH / 2 - 14) / yMaxG };
  } else {
    H = 320;
    const py = (H / 2 - 26) / yMaxG;
    R =
      fn === 'sin'
        ? py
        : Math.min(100, (H / 2 - 22) / (fn === 'tg' ? Math.max(1.45, Math.abs(a) + 0.3) : 1.45));
    c = { x: 26 + R * 1.3, y: H / 2 };
    const gx0 = c.x + R * 1.3 + 40;
    g = { x0: gx0, x1: W - 20, yc: H / 2, py };
  }
  const GX = (xPi: number) => g.x0 + ((g.x1 - g.x0) * (xPi - X_MIN)) / (X_MAX - X_MIN);
  const GY = (y: number) => g.yc - y * g.py;
  const yKlamp = (y: number) => Math.max(-yMaxG - 0.3, Math.min(yMaxG + 0.3, y));

  /* Точка P на круге. */
  const ugol = x * Math.PI;
  const P = { x: c.x + R * Math.cos(ugol), y: c.y - R * Math.sin(ugol) };
  const fNow = fx(fn, x);
  /* Обрезка у круга: у тангенса — до точки (1; a) на оси тангенсов. */
  const kKlip = fn === 'tg' ? Math.max(1.45, Math.abs(a) + 0.3) : 1.45;

  /* График: пройденный и тень целиком; у тангенса — ветви между полюсами. */
  const vetvi = (ot: number, doX: number): string[] => {
    const out: string[] = [];
    let tek: string[] = [];
    const N = 260;
    for (let i = 0; i <= N; i += 1) {
      const xx = ot + ((doX - ot) * i) / N;
      if (xx > doX) break;
      if (fn === 'tg' && Math.abs(Math.cos(xx * Math.PI)) < 0.03) {
        if (tek.length > 1) out.push(tek.join(' '));
        tek = [];
        continue;
      }
      tek.push(`${GX(xx).toFixed(1)},${GY(yKlamp(fx(fn, xx))).toFixed(1)}`);
    }
    if (tek.length > 1) out.push(tek.join(' '));
    return out;
  };
  const ten = vetvi(X_MIN, X_MAX);
  const proyden = x > X_MIN ? vetvi(X_MIN, x) : [];

  const proydeny = k.filter((r) => val(r.t) <= x + 1e-9);
  const naKruge = new Map<number, Q>();
  for (const r of proydeny) {
    const v = vKruge(r.t);
    naKruge.set(val(v), v);
  }
  const posledniy = proydeny.at(-1);

  const deleniya = [-2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2].filter(
    (m) => !uzko || Number.isInteger(m),
  );
  const nuzhnyy = k.find((r) => r.nuzhnyy);

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
        <clipPath id={`${id}-graf`}>
          <rect
            x={g.x0 - 4}
            y={g.yc - yMaxG * g.py - 8}
            width={g.x1 - g.x0 + 8}
            height={2 * yMaxG * g.py + 16}
          />
        </clipPath>
        <clipPath id={`${id}-krug`}>
          <rect x={c.x - R * 1.45} y={c.y - R * kKlip} width={R * 2.9} height={R * 2 * kKlip} />
        </clipPath>
      </defs>

      {/* ── Круг ── */}
      <g className="zv6-krug">
        <path className="zv-os" d={`M${c.x - R * 1.3} ${c.y} H${c.x + R * 1.3}`} />
        <path className="zv-os" d={`M${c.x} ${c.y + R * 1.3} V${c.y - R * 1.3}`} />
        <circle className="zv6-okruzhnost" cx={c.x} cy={c.y} r={R} />
        <g clipPath={`url(#${id}-krug)`}>
          {fn === 'sin' ? (
            <line
              className="zv6-liniya-a"
              x1={c.x - R * 1.3}
              x2={c.x + R * 1.3}
              y1={c.y - a * R}
              y2={c.y - a * R}
            />
          ) : null}
          {fn === 'cos' ? (
            <line
              className="zv6-liniya-a"
              x1={c.x + a * R}
              x2={c.x + a * R}
              y1={c.y - R * 1.3}
              y2={c.y + R * 1.3}
            />
          ) : null}
          {fn === 'tg' ? (
            <>
              <line
                className="zv6-os-tg"
                x1={c.x + R}
                x2={c.x + R}
                y1={c.y - R * 1.4}
                y2={c.y + R * 1.4}
              />
              {Math.abs(Math.cos(ugol)) > 0.05 ? (
                <line
                  className="zv6-luch-tg"
                  x1={c.x - R * 1.4 * Math.cos(ugol) * Math.sign(Math.cos(ugol))}
                  y1={c.y + R * 1.4 * Math.sin(ugol) * Math.sign(Math.cos(ugol))}
                  x2={c.x + R}
                  y2={c.y - R * Math.tan(ugol)}
                />
              ) : null}
              <circle className="zv6-tochka-a" cx={c.x + R} cy={c.y - a * R} r="5" />
            </>
          ) : null}
        </g>
        {/* Проекция точки на ось значения. */}
        {fn === 'sin' ? (
          <line className="zv6-proekciya" x1={P.x} x2={c.x} y1={P.y} y2={P.y} />
        ) : null}
        {fn === 'cos' ? (
          <line className="zv6-proekciya" x1={P.x} x2={P.x} y1={P.y} y2={c.y} />
        ) : null}
        {/* Отмеченные корни на круге. */}
        {[...naKruge.values()].map((v) => {
          const th = val(v) * Math.PI;
          const px = c.x + R * Math.cos(th);
          const py = c.y - R * Math.sin(th);
          return (
            <g key={val(v)}>
              <circle className="zv6-koren-krug" cx={px} cy={py} r="6" />
              <text
                className="zv6-ugol"
                x={c.x + R * 1.27 * Math.cos(th)}
                y={c.y - R * 1.2 * Math.sin(th) + 5}
                textAnchor="middle"
              >
                {ugolText(v)}
              </text>
            </g>
          );
        })}
        <line className="zv6-radius" x1={c.x} y1={c.y} x2={P.x} y2={P.y} />
        <circle className="zv6-tochka-p" cx={P.x} cy={P.y} r="7" />
      </g>

      {/* ── График ── */}
      <g className="zv6-graf">
        {deleniya.map((m) => (
          <g key={m}>
            <line className="zv-setka" x1={GX(m)} x2={GX(m)} y1={GY(yMaxG)} y2={GY(-yMaxG)} />
            <text className="zv-chislo" x={GX(m)} y={GY(0) + 17} textAnchor="middle">
              {m === 0 ? '' : ugolText(q(Math.round(m * 2), 2))}
            </text>
          </g>
        ))}
        {[-1, 1].map((y) => (
          <g key={y}>
            <line className="zv-setka" x1={g.x0} x2={g.x1} y1={GY(y)} y2={GY(y)} />
            <text
              className="zv-chislo"
              x={g.x0 - 6}
              y={GY(y)}
              textAnchor="end"
              dominantBaseline="middle"
            >
              {ru(y, 0)}
            </text>
          </g>
        ))}
        <path className="zv-os" d={`M${g.x0} ${GY(0)} H${g.x1 + 6} m-6 -4 l6 4 l-6 4`} />
        {fn === 'tg'
          ? [-1.5, -0.5, 0.5, 1.5].map((m) => (
              <line
                key={m}
                className="zv6-asimptota"
                x1={GX(m)}
                x2={GX(m)}
                y1={GY(yMaxG)}
                y2={GY(-yMaxG)}
              />
            ))
          : null}
        <line className="zv6-liniya-a" x1={g.x0} x2={g.x1} y1={GY(a)} y2={GY(a)} />
        <g clipPath={`url(#${id}-graf)`}>
          {ten.map((pts, i) => (
            <polyline key={`t${i}`} className="zv6-krivaya-ten" points={pts} />
          ))}
          {proyden.map((pts, i) => (
            <polyline key={`p${i}`} className="zv6-krivaya" points={pts} />
          ))}
        </g>
        {proydeny.map((r) => (
          <g key={val(r.t)} className={clsx('zv6-koren', konec && r.nuzhnyy && 'is-nuzhnyy')}>
            <line x1={GX(val(r.t))} x2={GX(val(r.t))} y1={GY(a)} y2={GY(0)} />
            <circle cx={GX(val(r.t))} cy={GY(0)} r={konec && r.nuzhnyy ? 7 : 5} />
          </g>
        ))}
        {/* Текущая точка графика и связь с кругом (у синуса — одна высота). */}
        {Number.isFinite(fNow) && Math.abs(fNow) <= yMaxG ? (
          <>
            {fn === 'sin' && !uzko ? (
              <line className="zv6-svyaz" x1={P.x + 8} x2={GX(x) - 6} y1={P.y} y2={GY(fNow)} />
            ) : null}
            <circle className="zv6-tochka-p" cx={GX(x)} cy={GY(fNow)} r="6" />
          </>
        ) : null}
        <Podpis
          x={Math.min(g.x1 - 30, Math.max(g.x0 + 30, g.x1 - 34))}
          y={GY(a) - (a > yMaxG - 0.4 ? -16 : 16)}
          text={T.svgA(aText(kod))}
          klass="is-zhar"
        />
        {konec && nuzhnyy ? (
          <Podpis
            x={GX(val(nuzhnyy.t))}
            y={GY(0) + (a >= 0 ? 36 : -36)}
            text={ugolText(nuzhnyy.t)}
            klass="is-zhar"
          />
        ) : posledniy && !konec ? (
          <Podpis
            x={GX(val(posledniy.t))}
            y={GY(0) + (a >= 0 ? 36 : -36)}
            text={ugolText(posledniy.t)}
            klass="is-sin"
            opacity={0.95}
          />
        ) : null}
      </g>
    </svg>
  );
}
