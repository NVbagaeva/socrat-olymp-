'use client';

import { useId, useMemo, useState } from 'react';
import '@/lib/graph/families/trig.js';
import { katex } from '@/lib/graph/katex';
import { renderGraph } from '@/lib/graph/renderer.js';
import { Tex } from '@/components/ui/Tex';

type Fn = 'cos' | 'sin' | 'tg';

/* Ползунки: a без нуля (при a = 0 функция постоянна), b — шагом 0,5. */
const AS = [-3, -2.5, -2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2, 2.5, 3];
const BS = [-3, -2.5, -2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2, 2.5, 3];
const XU = Math.PI / 4;
const WIN = { xmin: -5, xmax: 9, ymin: -7, ymax: 7 };
/* Зазор между ветвью тангенса и асимптотой у рамки — как у чертежей
   задач: 0,2 клетки. Дальше этого |tg x| не поднимается. */
const TAN_EDGE = Math.tan(Math.PI / 2 - 0.2 * XU);
const FN_TEX: Record<Fn, string> = { cos: '\\cos', sin: '\\sin', tg: '\\operatorname{tg}' };

function windowFor(fn: Fn, a: number, b: number) {
  if (fn !== 'tg') {
    return WIN;
  }
  return {
    ...WIN,
    ymax: Math.max(1, Math.min(WIN.ymax, Math.floor(b + TAN_EDGE * Math.abs(a)))),
    ymin: Math.min(-1, Math.max(WIN.ymin, Math.ceil(b - TAN_EDGE * Math.abs(a)))),
  };
}

function num(value: number): string {
  return String(value).replace('.', '{,}');
}

function plain(value: number): string {
  return String(value).replace('.', ',').replace('-', '−');
}

function formulaOf(fn: Fn, a: number, b: number): string {
  const lead = a === 1 ? '' : a === -1 ? '-' : `${num(a)} `;
  const term = b === 0 ? '' : b > 0 ? ` + ${num(b)}` : ` - ${num(-b)}`;
  return `y = ${lead}${FN_TEX[fn]} x${term}`;
}

/**
 * Живой график «Тригонометрические функции»: функция (cos, sin, tg),
 * множитель a и слагаемое b. Сетка как в банке: клетка по x — π/4,
 * по y — единица. У тангенса — асимптоты пунктиром.
 */
export function TrigPlayground() {
  const id = useId();
  const [fn, setFn] = useState<Fn>('cos');
  const [aIndex, setAIndex] = useState(9);
  const [bIndex, setBIndex] = useState(6);
  const a = AS[aIndex] ?? 2;
  const b = BS[bIndex] ?? 0;
  const win = windowFor(fn, a, b);

  const svg = useMemo(() => {
    const ticksX = [];
    for (let X = win.xmin; X <= win.xmax; X++) {
      if (X !== 0) {
        ticksX.push(X === 4 ? { at: X, label: 'π' } : { at: X });
      }
    }
    const ticksY = [];
    for (let Y = win.ymin; Y <= win.ymax; Y++) {
      if (Y !== 0) {
        ticksY.push(Y === 1 ? { at: Y, label: '1' } : { at: Y });
      }
    }
    const asymptotes =
      fn === 'tg'
        ? [-2, 2, 6].map((X) => ({
            type: 'segment',
            from: [X, win.ymin],
            to: [X, win.ymax],
            style: 'dashed',
            color: 'asymptote',
          }))
        : [];
    return renderGraph({
      window: win,
      grid: { step: 1, show: true },
      axes: { labelX: 'x', labelY: 'y', origin: '0', ticks: { x: ticksX, y: ticksY } },
      axisLabels: 'minimal',
      curves: [{ type: 'trig', fn, a, b, yu: 1, color: 'lineA', label: null }],
      points: [{ x: fn === 'sin' ? 2 : fn === 'tg' ? 1 : 0, y: a + b, style: 'solid', color: 'lineB', label: null }],
      shapes: [
        ...asymptotes,
        { type: 'segment', from: [win.xmin, b], to: [win.xmax, b], style: 'dashed', color: 'muted' },
      ],
      alt: 'Живой график тригонометрической функции',
    }) as string;
  }, [fn, a, b, win]);
  const formulaHtml = useMemo(
    () => katex.renderToString(formulaOf(fn, a, b), { throwOnError: false }),
    [fn, a, b],
  );
  const where = fn === 'cos' ? 'x = 0' : fn === 'sin' ? 'x = \\dfrac{\\pi}{2}' : 'x = \\dfrac{\\pi}{4}';
  const words =
    fn === 'tg'
      ? `Пунктир — прямая $y = ${num(b)}$: через неё график проходит при $x = 0$. ` +
        `Оранжевая точка — значение при ${'$' + where + '$'}: $a + b = ${num(a + b)}$.`
      : `Середина волны — прямая $y = ${num(b)}$, наибольшее значение $${num(b + Math.abs(a))}$, наименьшее $${num(b - Math.abs(a))}$. ` +
        `Оранжевая точка — значение при ${'$' + where + '$'}: $a + b = ${num(a + b)}$.`;

  return (
    <section className="play" aria-labelledby={`${id}-title`}>
      <h4 className="qth-card__title play__title" id={`${id}-title`}>
        Поиграй с тригонометрическими функциями
      </h4>
      <p className="play__lead">
        <Tex text="Переключай функцию, двигай ползунки и смотри, как $a$ растягивает график, а $b$ поднимает и опускает его." />
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
            <div className="play__presets" role="group" aria-label="Функция">
              <span className="play__presets-title">Функция</span>
              <div className="play__preset-row">
                {(['cos', 'sin', 'tg'] as Fn[]).map((name) => (
                  <button
                    key={name}
                    type="button"
                    className="play__preset"
                    aria-pressed={fn === name}
                    onClick={() => setFn(name)}
                  >
                    <Tex text={`$${FN_TEX[name]} x$`} />
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="play__field">
            <label className="play__label" htmlFor={`${id}-a`}>
              Множитель
              <span className="play__value">a = {plain(a)}</span>
            </label>
            <input
              className="play__range"
              id={`${id}-a`}
              type="range"
              min={0}
              max={AS.length - 1}
              step={1}
              value={aIndex}
              aria-valuetext={`a = ${plain(a)}`}
              onChange={(event) => setAIndex(Number(event.target.value))}
            />
            <p className="play__hint">
              <Tex text="Нуля на ползунке нет: при $a = 0$ функция постоянна. Отрицательное $a$ переворачивает график." />
            </p>
          </div>
          <div className="play__field">
            <label className="play__label" htmlFor={`${id}-b`}>
              Слагаемое
              <span className="play__value">b = {plain(b)}</span>
            </label>
            <input
              className="play__range"
              id={`${id}-b`}
              type="range"
              min={0}
              max={BS.length - 1}
              step={1}
              value={bIndex}
              aria-valuetext={`b = ${plain(b)}`}
              onChange={(event) => setBIndex(Number(event.target.value))}
            />
            <p className="play__hint">
              <Tex text="Весь график сдвигается вверх или вниз на $b$ вместе с пунктиром." />
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
