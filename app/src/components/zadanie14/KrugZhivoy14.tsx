'use client';

import { useRef, useState, type PointerEvent, type KeyboardEvent } from 'react';
import { Tex } from '@/components/ui/Tex';
import { piTex, q } from '@/lib/zadanie14/ugol';

const R = 100;
const SHAG = Math.PI / 12;

/** Точные значения на табличных углах (кратных 30° и 45°). */
function tochno(theta: number): { cos: string; sin: string } | null {
  const g0 = (theta * 180) / Math.PI;
  const g = Math.round(g0);
  if (Math.abs(g0 - g) > 1e-6) return null;
  const v: Record<number, string> = {
    0: '0',
    30: '\\dfrac{1}{2}',
    45: '\\dfrac{\\sqrt{2}}{2}',
    60: '\\dfrac{\\sqrt{3}}{2}',
    90: '1',
  };
  const zn = (x: number, t: string) => (t === '0' ? '0' : x < 0 ? `-${t}` : t);
  const gg = ((g % 360) + 360) % 360;
  /* Опорный угол первой четверти: синус — по нему, косинус — по дополнению. */
  const r = gg <= 90 ? gg : gg <= 180 ? 180 - gg : gg <= 270 ? gg - 180 : 360 - gg;
  const s = v[r];
  const c = v[90 - r];
  if (s === undefined || c === undefined) return null;
  return { cos: zn(Math.cos((gg * Math.PI) / 180), c), sin: zn(Math.sin((gg * Math.PI) / 180), s) };
}

function chislo(x: number): string {
  const v = Math.abs(x) < 5e-4 ? 0 : x;
  return v.toFixed(3).replace('.', '{,}').replace('-', '-');
}

/**
 * Живая окружность: точку можно тащить пальцем или мышью (и стрелками
 * с клавиатуры, шаг $\frac{\pi}{12}$). Видны угол — с учётом полных
 * оборотов, как $\frac{13\pi}{3}=4\pi+\frac{\pi}{3}$, — координаты
 * $(\cos;\,\sin)$ и проекции на оси. У табличных углов точка
 * примагничивается, значения — точные.
 */
export function KrugZhivoy14() {
  const [ugol, setUgol] = useState(Math.PI / 6);
  const svg = useRef<SVGSVGElement>(null);
  const tashchu = useRef(false);

  const izSobytiya = (e: PointerEvent<SVGSVGElement>) => {
    const el = svg.current;
    if (el === null) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 320 - 160;
    const y = ((e.clientY - r.top) / r.height) * 320 - 160;
    let t = Math.atan2(-y, x);
    /* Магнит к кратным π/12. */
    const k = Math.round(t / SHAG);
    if (Math.abs(t - k * SHAG) < 0.05) t = k * SHAG;
    /* Учитываем обороты: новый угол — ближайший к прежнему. */
    setUgol((prev) => {
      let d = t - prev;
      d -= 2 * Math.PI * Math.round(d / (2 * Math.PI));
      return prev + d;
    });
  };

  const klavisha = (e: KeyboardEvent<SVGSVGElement>) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      setUgol((u0) => Math.round(u0 / SHAG + 1) * SHAG);
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      setUgol((u0) => Math.round(u0 / SHAG - 1) * SHAG);
    }
  };

  const x = R * Math.cos(ugol);
  const y = -R * Math.sin(ugol);
  const dolya = ugol / Math.PI;
  const n12 = Math.round(dolya * 12);
  const kratnyy = Math.abs(dolya * 12 - n12) < 1e-6;
  const ugolTex = kratnyy ? piTex(q(n12, 12)) : `${chislo(ugol)}`;
  const oboroty = kratnyy ? Math.floor((n12 + 1e-9) / 24) : 0;
  const ostatok = kratnyy ? piTex(q(n12 - 24 * oboroty, 12)) : '';
  const razlozhenie =
    kratnyy && (oboroty !== 0) ? `=${piTex(q(2 * oboroty))}+${ostatok}` : '';
  const ex = kratnyy ? tochno(ugol) : null;
  const gradusy = Math.round((ugol * 180) / Math.PI);
  /* Дуга угла от 0 до текущего (в пределах одного оборота от начала). */
  const t1 = ((ugol % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const rd = 26;
  const large = t1 > Math.PI ? 1 : 0;
  const dugaD = `M${rd} 0A${rd} ${rd} 0 ${large} 0 ${(rd * Math.cos(t1)).toFixed(2)} ${(-rd * Math.sin(t1)).toFixed(2)}`;

  return (
    <div className="z14-inter z14-zhivoy">
      <svg
        ref={svg}
        className="z14-zhivoy__svg"
        viewBox="-160 -160 320 320"
        role="slider"
        tabIndex={0}
        aria-label="Угол на окружности: перетащите точку"
        aria-valuemin={-720}
        aria-valuemax={720}
        aria-valuenow={gradusy}
        aria-valuetext={`${gradusy} градусов`}
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
        onKeyDown={klavisha}
      >
        <line className="k14__os" x1={-140} y1={0} x2={140} y2={0} />
        <line className="k14__os" x1={0} y1={140} x2={0} y2={-140} />
        <path className="k14__strelka" d="M131 -4.5L140 0L131 4.5Z" />
        <path className="k14__strelka" d="M-4.5 -131L0 -140L4.5 -131Z" />
        <text className="z14-zhivoy__os" x={128} y={20}>
          cos
        </text>
        <text className="z14-zhivoy__os" x={-34} y={-128}>
          sin
        </text>
        <circle className="k14__okr" cx={0} cy={0} r={R} />
        {t1 > 1e-6 ? <path className="z14-zhivoy__duga" d={dugaD} /> : null}
        <line className="k14__luch" x1={0} y1={0} x2={x} y2={y} />
        <line className="k14__proekciya" x1={x} y1={y} x2={x} y2={0} />
        <line className="k14__proekciya" x1={x} y1={y} x2={0} y2={y} />
        <circle className="k14__tochka k14__tochka--znach" cx={x} cy={0} r={4} />
        <circle className="k14__tochka k14__tochka--znach" cx={0} cy={y} r={4} />
        <circle className="z14-zhivoy__ruchka" cx={x} cy={y} r={11} />
        <circle className="k14__tochka k14__tochka--akcent" cx={x} cy={y} r={6} />
      </svg>
      <dl className="z14-zhivoy__dannye" aria-live="polite">
        <div>
          <dt>Угол</dt>
          <dd>
            <Tex text={`$x=${ugolTex}${razlozhenie}$ (${gradusy}°)`} />
          </dd>
        </div>
        <div>
          <dt>Абсцисса</dt>
          <dd>
            <Tex text={`$\\cos x=${ex ? ex.cos : chislo(Math.cos(ugol))}$`} />
          </dd>
        </div>
        <div>
          <dt>Ордината</dt>
          <dd>
            <Tex text={`$\\sin x=${ex ? ex.sin : chislo(Math.sin(ugol))}$`} />
          </dd>
        </div>
      </dl>
      <div className="z14-inter__nav">
        <button type="button" className="btn btn--secondary btn--sm" onClick={() => setUgol((u0) => u0 + 2 * Math.PI)}>
          + оборот
        </button>
        <button type="button" className="btn btn--secondary btn--sm" onClick={() => setUgol((u0) => u0 - 2 * Math.PI)}>
          − оборот
        </button>
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => setUgol(Math.PI / 6)}>
          Сначала
        </button>
      </div>
    </div>
  );
}
