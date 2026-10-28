'use client';

import { lazy, Suspense, useMemo } from 'react';

/* Код живого чертежа (движки и KaTeX) — отдельным куском: страница
   открывается с готовым SVG, чертёж оживает, когда кусок приехал. */
const Zhivoy = lazy(() =>
  import('./Zhivoy3d').then((m) => ({
    default: function ZhivoyIzJson({ json, className }: { json: string; className?: string }) {
      const d = useMemo(() => m.razobrat3d(json), [json]);
      return d === null ? null : <m.Zhivoy3d d={d} {...(className ? { className } : {})} />;
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
}: {
  svg: string;
  zhivoy?: string | undefined;
  className?: string;
}) {
  const kartinka = <span className={className} dangerouslySetInnerHTML={{ __html: svg }} />;
  if (zhivoy === undefined || zhivoy === '') return kartinka;
  return (
    <Suspense fallback={kartinka}>
      <Zhivoy json={zhivoy} {...(className ? { className } : {})} />
    </Suspense>
  );
}
