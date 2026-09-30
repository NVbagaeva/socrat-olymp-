'use client';

import { useId, useMemo, useState } from 'react';
import { playground } from '@/content/theoryQuadratic';
import { katex } from '@/lib/graph/katex';
import { renderGraph } from '@/lib/graph/renderer.js';
import { playgroundScene } from '@/lib/scenes';
import { MathTitle } from '../MathTitle';
import { Phrases } from '../Phrases';
import { phrases } from '../markup';

/** Число в тексте: запятая, не больше двух знаков, без хвоста нулей. */
function plain(value: number): string {
  return String(Math.round(value * 100) / 100).replace('.', ',');
}

/** То же число в записи TeX: запятая в фигурных скобках. */
function tex(value: number): string {
  return String(Math.round(value * 100) / 100).replace('.', '{,}');
}

/** Формула живой параболы: y = 2x² + 1, y = −0,5x² − 3, y = x², y = 3. */
function formulaOf(a: number, c: number): string {
  if (a === 0) {
    return `y = ${tex(c)}`;
  }
  const lead = a === 1 ? 'x^2' : a === -1 ? '-x^2' : `${tex(a)}x^2`;
  const tail = c === 0 ? '' : c > 0 ? ` + ${tex(c)}` : ` - ${tex(-c)}`;
  return `y = ${lead}${tail}`;
}

/** Описание чертежа словами: для экранного чтеца и подписи под ним. */
function describe(a: number, c: number): string {
  const words = playground.describe;
  const eq = formulaOf(a, c).replaceAll('{,}', ',').replace('^2', '²').replaceAll('-', '−');
  if (a === 0) {
    return `${words.line.charAt(0).toUpperCase()}${words.line.slice(1)} ${eq}`;
  }
  const width = Math.abs(a) > 1 ? words.narrower : Math.abs(a) < 1 ? words.wider : words.same;
  return `Парабола ${eq}, ${a > 0 ? words.up : words.down}, ${width}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Интерактивный блок «Поиграй с параболой».
 *
 * Чертёж собирает тот же движок graph/, что и все чертежи проекта:
 * на каждое движение ползунка сцена пересобирается и рисуется
 * заново. Состояние живёт только в памяти страницы.
 *
 * Пресеты 10, 100 и 0,01 выходят за шаг или диапазон ползунка:
 * ползунок встаёт в крайнее положение, подпись показывает фактическое
 * значение, формула и чертёж — точное значение пресета. Движение
 * ползунка возвращает a в его диапазон. При a = 0 квадрата нет:
 * чертёж показывает прямую y = c и говорит об этом словами.
 */
/* Буквы переменных в строке значения набираются один раз при загрузке
   модуля: рядом с ними стоит число, которое меняется на каждом шаге
   ползунка, а сама буква та же — пересобирать её незачем. */
const BUKVA_A = <Phrases parts={phrases('$a$')} />;
const BUKVA_C = <Phrases parts={phrases('$c$')} />;

export function ParabolaPlayground() {
  const [a, setA] = useState<number>(playground.a.initial);
  const [c, setC] = useState<number>(playground.c.initial);
  const id = useId();
  const aId = `${id}-a`;
  const cId = `${id}-c`;

  const svg = useMemo(() => renderGraph(playgroundScene(a, c)) as string, [a, c]);
  const formulaHtml = useMemo(
    () => katex.renderToString(formulaOf(a, c), { throwOnError: false, displayMode: false }),
    [a, c],
  );
  const words = describe(a, c);

  return (
    <section className="play" aria-labelledby={`${id}-title`}>
      <h4 className="qth-card__title play__title" id={`${id}-title`}>
        {playground.title}
      </h4>
      <p className="play__lead">
        <Phrases parts={phrases(playground.lead)} />
      </p>

      <div className="play__body">
        <div className="play__stage">
          {/* Формула набирается KaTeX на клиенте: она меняется с каждым
              движением ползунка. Разметка своя, из чисел этой страницы. */}
          <p className="play__formula" dangerouslySetInnerHTML={{ __html: formulaHtml }} />
          <div className="play__chart" dangerouslySetInnerHTML={{ __html: svg }} />
          <p className="play__describe" aria-live="polite">
            {words}
            {a === 0 ? '. ' : ''}
            {a === 0 ? (
              <span className="play__zero">
                <Phrases parts={phrases(playground.zero)} />
              </span>
            ) : null}
          </p>
        </div>

        <div className="play__controls">
          <div className="play__field">
            <label className="play__label" htmlFor={aId}>
              <MathTitle text={playground.a.label} />
              <span className="play__value">{BUKVA_A} = {plain(a)}</span>
            </label>
            <input
              className="play__range"
              id={aId}
              type="range"
              min={playground.a.min}
              max={playground.a.max}
              step={playground.a.step}
              value={clamp(a, playground.a.min, playground.a.max)}
              aria-label={playground.a.aria}
              aria-valuetext={`a = ${plain(a)}`}
              onChange={(event) => setA(Number(event.target.value))}
            />
            <div className="play__presets" role="group" aria-label={playground.presets.title}>
              <span className="play__presets-title">{playground.presets.title}</span>
              {[1, -1].map((sign) => (
                <div className="play__preset-row" key={sign}>
                  {playground.presets.values.map((value) => {
                    const preset = sign * value;
                    return (
                      <button
                        type="button"
                        className="play__preset"
                        key={preset}
                        aria-pressed={a === preset}
                        onClick={() => setA(preset)}
                      >
                        {plain(preset).replace('-', '−')}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
            <p className="play__hint">
              <Phrases parts={phrases(playground.presets.hint)} />
            </p>
          </div>

          <div className="play__field">
            <label className="play__label" htmlFor={cId}>
              <MathTitle text={playground.c.label} />
              <span className="play__value">{BUKVA_C} = {plain(c)}</span>
            </label>
            <input
              className="play__range"
              id={cId}
              type="range"
              min={playground.c.min}
              max={playground.c.max}
              step={playground.c.step}
              value={c}
              aria-label={playground.c.aria}
              aria-valuetext={`c = ${plain(c)}`}
              onChange={(event) => setC(Number(event.target.value))}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
