'use client';

import { useId, useMemo, useState } from 'react';
import '@/lib/graph/families/expo.js';
import '@/lib/graph/families/loga.js';
import { katex } from '@/lib/graph/katex';
import { renderGraph } from '@/lib/graph/renderer.js';
import { Tex } from '@/components/ui/Tex';

/* Основания на ползунке: только допустимые, a > 0 и a ≠ 1. */
const BASES = [
  { value: 1 / 4, tex: '\\frac{1}{4}', text: '1/4' },
  { value: 1 / 3, tex: '\\frac{1}{3}', text: '1/3' },
  { value: 1 / 2, tex: '\\frac{1}{2}', text: '1/2' },
  { value: 2, tex: '2', text: '2' },
  { value: 3, tex: '3', text: '3' },
  { value: 4, tex: '4', text: '4' },
];
const KS = [0.5, 1, 2, 3];
const WIN = { xmin: -5, xmax: 9, ymin: -5, ymax: 5 };
/* Зазор между кривой и асимптотой у края окна, в клетках — как у
   чертежей задач: меньше кривая ложится на асимптоту. */
const CLEARANCE = 0.2;

/**
 * Окно под текущие ползунки: у асимптоты кривая уходит вниз (a > 1)
 * или вверх (a < 1), и край окна там, где она ещё на CLEARANCE правее
 * асимптоты; ось Ox остаётся в кадре.
 */
function windowFor(a: number, d: number, k: number) {
  const tail = d + (k * Math.log(CLEARANCE)) / Math.log(a);
  if (a > 1) {
    return { ...WIN, ymin: Math.max(WIN.ymin, Math.min(-1, Math.ceil(tail - 1e-9))) };
  }
  return { ...WIN, ymax: Math.min(WIN.ymax, Math.max(1, Math.floor(tail + 1e-9))) };
}

type Mode = 'y' | 'x';

function num(value: number): string {
  return String(value).replace('.', '{,}');
}

function plain(value: number): string {
  return String(value).replace('.', ',').replace('-', '−');
}

/** Формула живого графика: y = 2 · log₃(x − 1), y = log_{1/2} x + 2. */
function formulaOf(baseTex: string, k: number, b: number, mode: Mode): string {
  const lead = k === 1 ? '' : `${num(k)} \\cdot `;
  const term = b === 0 ? '' : b > 0 ? ` + ${b}` : ` - ${-b}`;
  const log = `\\log_{${baseTex}}`;
  return mode === 'x' ? `y = ${lead}${log}(x${term})` : `y = ${lead}${log} x${term}`;
}

/**
 * Живой график «Логарифмическая функция»: основание a, сдвиг b и
 * растяжение k. Сдвиг b — вверх-вниз (logₐ x + b) или влево-вправо
 * (logₐ(x + b)). На чертеже — асимптота пунктиром и точка, где аргумент
 * логарифма равен единице: там y = b или 0. Переключатель показывает
 * обратную функцию — показательную — и прямую y = x: графики
 * симметричны относительно неё.
 */
export function LogPlayground() {
  const id = useId();
  const [baseIndex, setBaseIndex] = useState(3);
  const [b, setB] = useState(0);
  const [kIndex, setKIndex] = useState(1);
  const [mode, setMode] = useState<Mode>('y');
  const [mirror, setMirror] = useState(false);
  const base = BASES[baseIndex] ?? BASES[3]!;
  const k = KS[kIndex] ?? 1;
  const c = mode === 'x' ? b : 0;
  const d = mode === 'y' ? b : 0;

  const win = windowFor(base.value, d, k);
  const svg = useMemo(() => {
    const lo = Math.max(win.xmin, win.ymin);
    const hi = Math.min(win.xmax, win.ymax);
    return renderGraph({
      window: win,
      grid: { step: 1, show: true },
      axes: { labelX: 'x', labelY: 'y', origin: '0' },
      axisLabels: 'minimal',
      curves: [
        ...(mirror
          ? [{ type: 'expo', a: Math.pow(base.value, 1 / k), c: -d, d: -c, color: 'lineB', label: null }]
          : []),
        { type: 'loga', a: base.value, c, d, k, color: 'lineA', label: null },
      ],
      points: [{ x: 1 - c, y: d, style: 'solid', color: 'lineB', label: null }],
      shapes: [
        ...(c === 0
          ? []
          : [{ type: 'segment', from: [-c, win.ymin], to: [-c, win.ymax], style: 'dashed', color: 'asymptote' }]),
        ...(mirror ? [{ type: 'segment', from: [lo, lo], to: [hi, hi], style: 'dashed', color: 'muted' }] : []),
      ],
      alt: 'Живой график логарифмической функции',
    }) as string;
  }, [base.value, c, d, k, win, mirror]);
  const formulaHtml = useMemo(
    () => katex.renderToString(formulaOf(base.tex, k, b, mode), { throwOnError: false }),
    [base.tex, k, b, mode],
  );
  const words =
    `${base.value > 1 ? 'Возрастает' : 'Убывает'}: основание ${base.value > 1 ? 'больше' : 'меньше'} единицы. ` +
    `Асимптота $x = ${num(-c)}$, область определения $x > ${num(-c)}$. ` +
    `Точка, где аргумент равен единице: $(${num(1 - c)};\\, ${num(d)})$.`;

  return (
    <section className="play" aria-labelledby={`${id}-title`}>
      <h4 className="qth-card__title play__title" id={`${id}-title`}>
        Поиграй с логарифмической функцией
      </h4>
      <p className="play__lead">
        <Tex text="Двигай ползунки и смотри, что происходит с графиком, асимптотой и оранжевой точкой — там аргумент логарифма равен единице." />
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
              <Tex text="Единицы на ползунке нет: степень единицы всегда равна $1$, логарифм по основанию $1$ не определён." />
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
                    ? 'Вместе с графиком сдвигается асимптота: $x = -b$. Плюс под логарифмом — сдвиг влево.'
                    : 'Асимптота остаётся на месте — ось $Oy$: сдвигаются только значения.'
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
          <div className="play__field">
            <div className="play__preset-row">
              <button
                type="button"
                className="play__preset"
                aria-pressed={mirror}
                onClick={() => setMirror(!mirror)}
              >
                <Tex text="Обратная функция и прямая $y = x$" />
              </button>
            </div>
            <p className="play__hint">
              <Tex text="Логарифм — обратная функция к показательной: графики симметричны относительно прямой $y = x$." />
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
