'use client';

import { useMemo, useState } from 'react';
import { Tex } from '@/components/ui/Tex';
import { IRRACIONALNYE_7 } from '@/content/teoriya7-irr';
import { renderGraph, THEME } from '@/lib/graph/renderer.js';
import '@/lib/graph/families/sqrt.js';

const G = IRRACIONALNYE_7.grafik;

/* Фиолетовый — цвет вида 2 «корень равен выражению»: прямая y = x.
   Движок берёт цвета по ключу из THEME; ключ добавляется один раз. */
const COLORS = THEME.colors as unknown as Record<string, string | null>;
COLORS['violet'] ??= 'var(--violet-600, #7c4ddb)';

/**
 * Живой рисунок к виду 2 (теория №7): на одних осях y = √(x + 2),
 * прямая y = x и пунктиром y = −x. После возведения в квадрат
 * x + 2 = x² получаем 2 и −1: корень 2 — пересечение с y = x (наш),
 * корень −1 — пересечение с y = −x, он из «чужого» уравнения
 * √(x + 2) = −x и отмечен оранжевым крестиком. Кнопка прячет и
 * показывает «чужое» уравнение. Чисел на осях нет — только координаты
 * двух точек. Рисует движок графиков (renderGraph), как все чертежи.
 */
function scene(chuzhoe: boolean) {
  const krest = (x: number, y: number, r: number) => [
    { type: 'segment', from: [x - r, y - r], to: [x + r, y + r], color: 'accent', width: 4.5 },
    { type: 'segment', from: [x - r, y + r], to: [x + r, y - r], color: 'accent', width: 4.5 },
  ];
  const curves: unknown[] = [
    { type: 'sqrt', a: 1, c: -2, color: 'lineA' },
    { type: 'line', k: 1, b: 0, color: 'violet' },
  ];
  const shapes: unknown[] = [
    { type: 'dot', at: [2, 2], color: 'violet', radius: 7 },
    { type: 'label', at: [2.15, 2.55], text: '(2; 2)', color: 'violet', size: 16, anchor: 'start' },
  ];
  if (chuzhoe) {
    curves.push({ type: 'line', k: -1, b: 0, color: 'violet', style: 'dashed' });
    shapes.push(...krest(-1, 1, 0.24), {
      type: 'label',
      at: [-1.25, 1.5],
      text: '(−1; 1)',
      color: 'accent',
      size: 16,
      anchor: 'end',
    });
  }
  return {
    window: { xmin: -3.5, xmax: 4.5, ymin: -1.5, ymax: 4 },
    cell: 52,
    grid: { step: 1, show: true },
    axes: { labelX: 'x', labelY: 'y', origin: '' },
    axisLabels: 'none',
    curves,
    points: [],
    shapes,
    alt: chuzhoe
      ? 'График квадратного корня, прямая «игрек равно икс» и пунктиром прямая «игрек равно минус икс»: наш корень — точка с абсциссой 2, посторонний — точка с абсциссой минус 1'
      : 'График квадратного корня и прямая «игрек равно икс» пересекаются в точке с абсциссой 2',
  };
}

export function GrafikIrr7() {
  const [chuzhoe, setChuzhoe] = useState(true);
  const svg = useMemo(() => renderGraph(scene(chuzhoe)) as string, [chuzhoe]);
  return (
    <figure className="z7-irr-graf">
      <figcaption className="z7-irr-graf__title">{G.title}</figcaption>
      <ul className="z7-irr-graf__legenda">
        {G.legenda
          .filter((l) => chuzhoe || l.ton !== 'chuzhoy')
          .map((l) => (
            <li className={`z7-irr-graf__l z7-irr-graf__l--${l.ton}`} key={l.tex}>
              <span className="z7-irr-graf__liniya" aria-hidden="true" />
              <Tex text={`$${l.tex}$`} />
            </li>
          ))}
      </ul>
      <span className="z7-irr-graf__svg" dangerouslySetInnerHTML={{ __html: svg }} />
      <button
        type="button"
        className="z7-krug__knopka z7-irr-graf__knopka"
        aria-pressed={chuzhoe}
        onClick={() => setChuzhoe(!chuzhoe)}
      >
        {chuzhoe ? G.skryt : G.pokazat}
      </button>
      <p className="z7-irr-graf__podpis">
        <Tex text={G.podpis} />
      </p>
    </figure>
  );
}
