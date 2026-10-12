'use client';

import { clsx } from 'clsx';
import { useMemo, useRef, useState } from 'react';
import { Tex } from '@/components/ui/Tex';
import { pustoyOtchet, renderPlan } from '@/lib/planimetriya/render';
import type { T2 } from '@/lib/planimetriya/types';
import { zhivaya, type Tochki } from '@/lib/planimetriya/zhivye';

/** Шаг клавиатуры: доля ширины окна сцены. */
const SHAG_KLAVIATURY = 0.02;

/**
 * Живой чертёж: вершину можно тянуть мышью, пальцем или стрелками
 * клавиатуры, движок перерисовывает фигуру, величины под чертежом
 * пересчитываются (lib/planimetriya/zhivye.ts).
 *
 * Рисунок — тот же renderPlan, что у всех чертежей, в неподвижном
 * окне сцены: масштаб не меняется при перетаскивании. Поверх — слой
 * ручек в той же системе координат (viewBox рисунка): кружки у
 * подвижных вершин. Ограничения сцены не дают фигуре выродиться: так
 * тянуть нельзя — вершина остаётся на месте. При печати ручки
 * скрыты, на бумаге — кадр в нынешнем положении.
 */
export function ZhivoyChertezh({ id, className }: { id: string; className?: string }) {
  const stsena = zhivaya(id);
  const [t, setT] = useState<Tochki>(stsena.nachalo);
  const [aktivnaya, setAktivnaya] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const { svg, ruchki, viewBox, preob } = useMemo(() => {
    const o = pustoyOtchet();
    const s = renderPlan(
      stsena.scena(t),
      { okno: stsena.okno, chisla: true, shirina: 320, vysota: 240 },
      o,
    );
    const vb = /viewBox="([^"]+)"/.exec(s)?.[1] ?? '0 0 100 100';
    return {
      svg: s,
      viewBox: vb,
      preob: o.preobrazovanie,
      ruchki: stsena.podvizhnye.map((n) => ({ n, p: o.ekran[n] ?? ([0, 0] as T2) })),
    };
  }, [stsena, t]);

  /** Экран (viewBox) → сцена. */
  function vSczenu(x: number, y: number): T2 {
    return [x / preob.s + preob.minx, preob.maxy - y / preob.s];
  }

  function podvinut(n: string, p: T2) {
    const q = stsena.ogranichit(n, p, t);
    if (q !== null) setT({ ...t, [n]: q });
  }

  function izSobytiya(e: React.PointerEvent): T2 | null {
    const el = svgRef.current;
    const m = el?.getScreenCTM();
    if (el === null || m === null || m === undefined) return null;
    const pt = el.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const q = pt.matrixTransform(m.inverse());
    return vSczenu(q.x, q.y);
  }

  const shagKl = (stsena.okno[2] - stsena.okno[0]) * SHAG_KLAVIATURY;

  return (
    <figure className={clsx('pl-zhivoy', className)}>
      <div className="pl-zhivoy__holst">
        <span className="pl-wrap" dangerouslySetInnerHTML={{ __html: svg }} />
        <svg
          ref={svgRef}
          className="pl-zhivoy__ruchki"
          viewBox={viewBox}
          role="group"
          aria-label={`${stsena.nazvanie}: вершины можно двигать`}
          onPointerMove={(e) => {
            if (aktivnaya === null) return;
            const p = izSobytiya(e);
            if (p !== null) podvinut(aktivnaya, p);
          }}
          onPointerUp={() => setAktivnaya(null)}
          onPointerCancel={() => setAktivnaya(null)}
        >
          {ruchki.map(({ n, p }) => (
            <circle
              key={n}
              className={clsx('pl-zhivoy__ruchka', aktivnaya === n && 'is-active')}
              cx={p[0]}
              cy={p[1]}
              r={11}
              tabIndex={0}
              role="slider"
              aria-label={`Точка ${n}: стрелки двигают точку`}
              aria-valuetext={`${n}`}
              onPointerDown={(e) => {
                (e.currentTarget.ownerSVGElement ?? e.currentTarget).setPointerCapture?.(
                  e.pointerId,
                );
                setAktivnaya(n);
              }}
              onKeyDown={(e) => {
                const d: Record<string, T2> = {
                  ArrowLeft: [-shagKl, 0],
                  ArrowRight: [shagKl, 0],
                  ArrowUp: [0, shagKl],
                  ArrowDown: [0, -shagKl],
                };
                const v = d[e.key];
                const cur = t[n];
                if (v === undefined || cur === undefined) return;
                e.preventDefault();
                podvinut(n, [cur[0] + v[0], cur[1] + v[1]]);
              }}
            />
          ))}
        </svg>
      </div>
      <figcaption className="pl-zhivoy__znacheniya">
        {stsena.znacheniya(t).map((z) => (
          <span key={z} className="pl-zhivoy__stroka">
            <Tex text={`$${z}$`} />
          </span>
        ))}
        <button type="button" className="pl-zhivoy__sbros" onClick={() => setT(stsena.nachalo)}>
          Вернуть как было
        </button>
      </figcaption>
    </figure>
  );
}
