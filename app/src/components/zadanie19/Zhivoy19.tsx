'use client';

import { useId, useMemo, useState } from 'react';
import { ZHIVOY_19 } from '@/content/zadanie19';
import { katex } from '@/lib/graph/katex';
import { typeset } from '@/lib/tex';
import { svg19 } from '@/lib/zadanie19/risunok';
import { mnozhestvoTex, zhivoy19, type Zhivoy19 as Opisanie19 } from '@/lib/zadanie19/zhivye';

/** «a = 0,25» формулой KaTeX: запятая, два знака. */
function znachenie(bukva: string, v: number): string {
  const s = String(Math.round(v * 100) / 100).replace('.', '{,}');
  return katex.renderToString(`${bukva}=${s}`, { throwOnError: true });
}

/** Заголовок блока — по тому, что движет параметр. */
function zagolovok(z: Opisanie19): string {
  if (z.vid === 'sdvig') return ZHIVOY_19.titleSdvig;
  if (z.vid === 'okruzhnost') return ZHIVOY_19.titleOkruzhnost;
  if (z.vid === 'gorizontal') return ZHIVOY_19.titleGorizontal;
  if (z.vid === 'grafik') return ZHIVOY_19.titleGrafik;
  return ZHIVOY_19.title;
}

/** Строка под рисунком: множество решений по x (метод областей) или число решений — и вывод, если он есть; у метода 7 — только вывод. */
function itogHtml(z: Opisanie19, a: number): string {
  if (z.mnozhestvo !== undefined) {
    const mn = katex.renderToString(mnozhestvoTex(z.mnozhestvo(a)), { throwOnError: true });
    return z.itog === undefined ? mn : `${mn}; ${typeset(z.itog(a))}`;
  }
  /* Метод 7: спрашивают про свойство «при всех x», а не про число решений. */
  if (z.resheniy === undefined && z.itog !== undefined) {
    return typeset(z.itog(a));
  }
  const n = ZHIVOY_19.resheniy(z.resheniy?.(a) ?? 0);
  return z.itog === undefined ? n : `${n}; ${typeset(z.itog(a))}`;
}

/**
 * Живой рисунок: подвижная прямая (или окружность) на ползунке параметра и число
 * решений под рисунком. У метода областей прямая — горизонтальная a = const,
 * а под рисунком — множество решений по x. Кнопки ставят прямую в особые положения —
 * в них число решений меняется. Стили — блок «Поиграй с параболой»
 * (.play, topic.css); сцену собирает тот же движок №12.
 */
export function Zhivoy19({ id }: { id: string }) {
  const z = zhivoy19(id);
  const [a, setA] = useState(z?.start ?? 0);
  const uid = useId().replace(/:/g, '');
  const svg = useMemo(() => (z === undefined ? '' : svg19(z.scena(a))), [z, a]);
  if (z === undefined) {
    return null;
  }
  return (
    <section className="play z19-zhivoy" aria-labelledby={`${uid}-t`}>
      <h5 className="qth-card__title play__title" id={`${uid}-t`}>
        {zagolovok(z)}
      </h5>
      <div className="play__body">
        <div className="play__stage">
          <div className="play__chart" dangerouslySetInnerHTML={{ __html: svg }} />
          <p className="play__describe" aria-live="polite">
            <span dangerouslySetInnerHTML={{ __html: znachenie(z.bukva, a) }} />:{' '}
            <span dangerouslySetInnerHTML={{ __html: itogHtml(z, a) }} />
          </p>
        </div>
        <div className="play__controls">
          <div className="play__field">
            <label className="play__label" htmlFor={`${uid}-r`}>
              <span
                className="play__value"
                dangerouslySetInnerHTML={{ __html: znachenie(z.bukva, a) }}
              />
            </label>
            <input
              id={`${uid}-r`}
              className="play__range"
              type="range"
              min={z.min}
              max={z.max}
              step={z.shag}
              value={a}
              onChange={(e) => setA(Number(e.target.value))}
            />
            <div className="play__presets" role="group" aria-label={ZHIVOY_19.osobye}>
              <span className="play__presets-title">{ZHIVOY_19.osobye}</span>
              <div className="play__preset-row">
                {z.osobye.map((o) => (
                  <button
                    key={o.tex}
                    type="button"
                    className="play__preset"
                    aria-pressed={Math.abs(a - o.a) < 1e-9}
                    onClick={() => setA(o.a)}
                    dangerouslySetInnerHTML={{
                      __html: katex.renderToString(o.tex, { throwOnError: true }),
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
