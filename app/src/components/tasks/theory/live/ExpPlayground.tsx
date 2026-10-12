'use client';

import { useId, useMemo, useState } from 'react';
import '@/lib/graph/families/expo.js';
import { katex } from '@/lib/graph/katex';
import { renderGraph } from '@/lib/graph/renderer.js';
import { Tex } from '@/components/ui/Tex';

/* Основания на ползунке: только допустимые, a > 0 и a ≠ 1. */
const BASES = [
  { value: 1 / 4, tex: '\\dfrac{1}{4}', text: '1/4' },
  { value: 1 / 3, tex: '\\dfrac{1}{3}', text: '1/3' },
  { value: 1 / 2, tex: '\\dfrac{1}{2}', text: '1/2' },
  { value: 2, tex: '2', text: '2' },
  { value: 3, tex: '3', text: '3' },
  { value: 4, tex: '4', text: '4' },
];
const KS = [0.5, 1, 2, 3];
const WIN = { xmin: -5, xmax: 5, ymin: -5, ymax: 8 };
/* Зазор между хвостом и асимптотой у края окна, в клетках — как у
   чертежей задач: меньше кривая ложится на асимптоту. */
const CLEARANCE = 0.2;

/**
 * Окно под текущие ползунки: со стороны хвоста край там, где кривая ещё
 * на CLEARANCE выше асимптоты, но ось Oy остаётся в кадре.
 */
function windowFor(a: number, c: number, k: number) {
  const tail = -c + Math.log(CLEARANCE / k) / Math.log(a);
  if (a > 1) {
    return { ...WIN, xmin: Math.max(WIN.xmin, Math.min(-1, Math.ceil(tail - 1e-9))) };
  }
  return { ...WIN, xmax: Math.min(WIN.xmax, Math.max(1, Math.floor(tail + 1e-9))) };
}

type Mode = 'y' | 'x';

function num(value: number): string {
  return String(value).replace('.', '{,}');
}

function plain(value: number): string {
  return String(value).replace('.', ',').replace('-', '−');
}

/** Формула живого графика: y = 2 · 3^(x − 1), y = (1/2)^x + 2. */
function formulaOf(baseTex: string, k: number, b: number, mode: Mode): string {
  const base = /dfrac/.test(baseTex) ? `\\left(${baseTex}\\right)` : baseTex;
  const lead = k === 1 ? '' : `${num(k)} \\cdot `;
  const term = b === 0 ? '' : b > 0 ? ` + ${b}` : ` - ${-b}`;
  return mode === 'x' ? `y = ${lead}${base}^{x${term}}` : `y = ${lead}${base}^x${term}`;
}

/**
 * Живой график «Показательная функция»: основание a, сдвиг b и
 * растяжение k. Сдвиг b — вверх-вниз (aˣ + b) или влево-вправо
 * (a^(x + b)), переключатель над ползунком. На чертеже — асимптота
 * пунктиром и точка, где показатель равен нулю: там y = k + b или k.
 * Чертёж рисует тот же движок graph/, что и все чертежи проекта.
 */
export function ExpPlayground() {
  const id = useId();
  const [baseIndex, setBaseIndex] = useState(3);
  const [b, setB] = useState(0);
  const [kIndex, setKIndex] = useState(1);
  const [mode, setMode] = useState<Mode>('y');
  const base = BASES[baseIndex] ?? BASES[3]!;
  const k = KS[kIndex] ?? 1;
  const c = mode === 'x' ? b : 0;
  const d = mode === 'y' ? b : 0;

  const win = windowFor(base.value, c, k);
  const svg = useMemo(
    () =>
      renderGraph({
        window: win,
        grid: { step: 1, show: true },
        axes: { labelX: 'x', labelY: 'y', origin: '0' },
        axisLabels: 'minimal',
        curves: [{ type: 'expo', a: base.value, c, d, k, color: 'lineA', label: null }],
        points: [{ x: -c, y: k + d, style: 'solid', color: 'lineB', label: null }],
        shapes:
          d === 0
            ? []
            : [
                {
                  type: 'segment',
                  from: [win.xmin, d],
                  to: [win.xmax, d],
                  style: 'dashed',
                  color: 'asymptote',
                },
              ],
        alt: 'Живой график показательной функции',
      }) as string,
    [base.value, c, d, k, win],
  );
  const formulaHtml = useMemo(
    () => katex.renderToString(formulaOf(base.tex, k, b, mode), { throwOnError: false }),
    [base.tex, k, b, mode],
  );
  const words =
    `${base.value > 1 ? 'Возрастает' : 'Убывает'}: основание ${base.value > 1 ? 'больше' : 'меньше'} единицы. ` +
    `Асимптота $y = ${num(d)}$. Точка, где показатель равен нулю: $(${num(-c)};\\, ${num(k + d)})$.`;

  return (
    <section className="play" aria-labelledby={`${id}-title`}>
      <h4 className="qth-card__title play__title" id={`${id}-title`}>
        Поиграй с показательной функцией
      </h4>
      <p className="play__lead">
        <Tex text="Двигай ползунки и смотри, что происходит с графиком, асимптотой и оранжевой точкой — там показатель равен нулю." />
      </p>
      <div className="play__body">
        <div className="play__stage">
          <p className="play__formula" dangerouslySetInnerHTML={{ __html: formulaHtml }} />
          <div className="play__chart" dangerouslySetInnerHTML={{ __html: svg }} />
          <p className="play__describe" aria-live="polite">
            <Tex text={words} />
          </p>
        </div>
        <div className="play__controls">
          <div className="play__field">
            <label className="play__label" htmlFor={`${id}-a`}>
              Основание
              <span className="play__value">a = {base.text}</span>
            </label>
            <input
              className="play__range"
              id={`${id}-a`}
              type="range"
              min={0}
              max={BASES.length - 1}
              step={1}
              value={baseIndex}
              aria-valuetext={`a = ${base.text}`}
              onChange={(event) => setBaseIndex(Number(event.target.value))}
            />
            <p className="play__hint">
              <Tex text="Единицы на ползунке нет: при $a = 1$ получилась бы прямая $y = 1$." />
            </p>
          </div>
          <div className="play__field">
            <div className="play__presets" role="group" aria-label="Куда сдвигает b">
              <span className="play__presets-title">
                <Tex text="Число $b$ сдвигает график" />
              </span>
              <div className="play__preset-row">
                <button
                  type="button"
                  className="play__preset"
                  aria-pressed={mode === 'y'}
                  onClick={() => setMode('y')}
                >
                  вверх-вниз
                </button>
                <button
                  type="button"
                  className="play__preset"
                  aria-pressed={mode === 'x'}
                  onClick={() => setMode('x')}
                >
                  влево-вправо
                </button>
              </div>
            </div>
            <label className="play__label" htmlFor={`${id}-b`}>
              Сдвиг
              <span className="play__value">b = {plain(b)}</span>
            </label>
            <input
              className="play__range"
              id={`${id}-b`}
              type="range"
              min={-3}
              max={3}
              step={1}
              value={b}
              aria-valuetext={`b = ${plain(b)}`}
              onChange={(event) => setB(Number(event.target.value))}
            />
            <p className="play__hint">
              <Tex
                text={
                  mode === 'x'
                    ? 'Плюс в показателе — сдвиг влево, минус — вправо: показатель равен нулю при $x = -b$.'
                    : 'Вместе с графиком сдвигается асимптота: $y = b$.'
                }
              />
            </p>
          </div>
          <div className="play__field">
            <label className="play__label" htmlFor={`${id}-k`}>
              Растяжение
              <span className="play__value">k = {plain(k)}</span>
            </label>
            <input
              className="play__range"
              id={`${id}-k`}
              type="range"
              min={0}
              max={KS.length - 1}
              step={1}
              value={kIndex}
              aria-valuetext={`k = ${plain(k)}`}
              onChange={(event) => setKIndex(Number(event.target.value))}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
