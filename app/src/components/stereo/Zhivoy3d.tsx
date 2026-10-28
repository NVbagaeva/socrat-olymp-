'use client';

import { useMemo } from 'react';
import { Chertezh3 } from '@/components/chertezh3/Chertezh3';
import { tekstyPodpisey } from '@/lib/chertezh3';
import { katex } from '@/lib/graph/katex';
import { ORTHO_AZIMUTH, ORTHO_ELEVATION, orthoAt } from '@/lib/solid/project';
import { renderSolid } from '@/lib/solid/render';
import type { Dannye3d } from '@/lib/stereo/zhivoy';
import { ZhivoyChertezh3d } from './ZhivoyChertezh3d';

/**
 * Живой чертёж по данным фигуры (lib/stereo/zhivoy.ts): модель lib/solid
 * — ZhivoyChertezh3d, первый кадр по её ракурсу; сценарий lib/chertezh3
 * — Chertezh3, подписи набираются KaTeX здесь же.
 */
export function Zhivoy3d({ d, className }: { d: Dannye3d; className?: string }) {
  const podpisiHtml = useMemo(
    () =>
      'sc' in d
        ? Object.fromEntries(
            tekstyPodpisey(d.sc).map((t) => [t, katex.renderToString(t, { throwOnError: false })]),
          )
        : {},
    [d],
  );
  /* Первый кадр модели — здесь же, по её ракурсу: SVG рядом мог быть
     нарисован другим видом (лист печати). */
  const svgModeli = useMemo(
    () =>
      'm' in d
        ? renderSolid(d.m, {
            view: orthoAt(
              d.m.rakurs?.azimuth ?? ORTHO_AZIMUTH,
              d.m.rakurs?.elevation ?? ORTHO_ELEVATION,
            ),
            ustoychivo: true,
          })
        : '',
    [d],
  );
  if ('sc' in d) {
    return (
      <Chertezh3
        scenariy={d.sc}
        podpisiHtml={podpisiHtml}
        pereklyuchatel={false}
        vspomSrazu={d.vspom === true}
        {...(className === undefined ? {} : { className })}
      />
    );
  }
  return (
    <ZhivoyChertezh3d
      model={d.m}
      svg={svgModeli}
      azimuth={d.m.rakurs?.azimuth ?? ORTHO_AZIMUTH}
      elevation={d.m.rakurs?.elevation ?? ORTHO_ELEVATION}
      podpisi={[]}
      {...(className === undefined ? {} : { className })}
    />
  );
}

/** Данные из строки JSON; битые — null (чертёж остаётся картинкой). */
export function razobrat3d(json: string | undefined | null): Dannye3d | null {
  if (json === undefined || json === null || json === '') return null;
  try {
    const d = JSON.parse(json) as Dannye3d;
    return 'm' in d || 'sc' in d ? d : null;
  } catch {
    return null;
  }
}
