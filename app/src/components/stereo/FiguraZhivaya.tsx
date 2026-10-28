'use client';

import { lazy, Suspense, useCallback, useEffect, useMemo, useRef } from 'react';
import type { Vid } from './vrashchenie/useVrashchenie';

/* Код живого чертежа (движки и KaTeX) — отдельным куском: страница
   открывается с готовым SVG, чертёж оживает, когда кусок приехал. */
const Zhivoy = lazy(() =>
  import('./Zhivoy3d').then((m) => ({
    default: function ZhivoyIzJson({
      json,
      className,
      onPovorot,
    }: {
      json: string;
      className?: string;
      onPovorot?: (vid: Vid) => void;
    }) {
      const d = useMemo(() => m.razobrat3d(json), [json]);
      return d === null ? null : (
        <m.Zhivoy3d
          d={d}
          {...(className ? { className } : {})}
          {...(onPovorot ? { onPovorot } : {})}
        />
      );
    },
  })),
);

/**
 * Рисунок задачи: с данными фигуры (Figure.zhivoy) — живой чертёж,
 * вращается руками; без них или пока код не приехал — готовый SVG.
 */
export function FiguraZhivaya({
  svg,
  zhivoy,
  className,
  onRakurs,
}: {
  svg: string;
  zhivoy?: string | undefined;
  className?: string;
  /** Чертёж повернули — ракурс, когда вращение затихло (не каждый кадр). */
  onRakurs?: (az: number, el: number) => void;
}) {
  const tishe = useRef(0);
  const onPovorot = useCallback(
    (v: Vid) => {
      if (onRakurs === undefined) return;
      window.clearTimeout(tishe.current);
      tishe.current = window.setTimeout(() => onRakurs(v.az, v.el), 300);
    },
    [onRakurs],
  );
  useEffect(() => () => window.clearTimeout(tishe.current), []);
  const kartinka = <span className={className} dangerouslySetInnerHTML={{ __html: svg }} />;
  if (zhivoy === undefined || zhivoy === '') return kartinka;
  return (
    <Suspense fallback={kartinka}>
      <Zhivoy
        json={zhivoy}
        {...(className ? { className } : {})}
        {...(onRakurs ? { onPovorot } : {})}
      />
    </Suspense>
  );
}
