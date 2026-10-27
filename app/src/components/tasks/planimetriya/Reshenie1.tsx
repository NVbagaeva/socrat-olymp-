'use client';

import { FigureZoom } from '@/components/ui';
import { TRENAZHER_1 } from '@/content/zadanie1';
import { openText } from '@/lib/planimetriya/secret';
import type { Razbor1, Zadacha1 } from '@/lib/planimetriya/trenazher/zadacha';

/** Закрытый блок задачи (подсказки, решение) — по отпечатку ответа. */
export function otkryt<T>(z: Zadacha1, blob: string): T | null {
  try {
    return JSON.parse(openText(blob, z.seal)) as T;
  } catch {
    return null;
  }
}

/**
 * Решение по шагам — оформление разбора «О задании» (Razbor1,
 * rich-example): подписи шагов, пояснения, выкладки, признаки
 * делимости в раскрывающейся панели, сверка с рисунком и чертёж со
 * всеми построениями.
 */
export function Reshenie1({ razbor }: { razbor: Razbor1 }) {
  return (
    <section
      className="z11-card z11-resh__razbor z1-resh__razbor"
      aria-label={TRENAZHER_1.reshenie}
    >
      <h3 className="z11-resh__h">{TRENAZHER_1.reshenie}</h3>
      <div className="rich-example__grid">
        <FigureZoom
          className="rich-example__figure z1-razbor__pic"
          label={TRENAZHER_1.risunokReshenie}
        >
          <span className="pl-wrap" dangerouslySetInnerHTML={{ __html: razbor.risunokSvg }} />
        </FigureZoom>
        <ol className="rich-example__steps">
          {razbor.shagi.map((s, i) => (
            <li className="rich-example__step" key={i}>
              <span
                className="rich-example__label"
                dangerouslySetInnerHTML={{ __html: s.zagolovok }}
              />
              {s.tekst.map((t, j) => (
                <p className="rich-p" key={j} dangerouslySetInnerHTML={{ __html: t }} />
              ))}
              {s.formuly.length === 0 ? null : (
                <div className="rich-lines">
                  {s.formuly.map((f, j) => (
                    <span
                      className="rich-formula"
                      key={j}
                      dangerouslySetInnerHTML={{ __html: f }}
                    />
                  ))}
                </div>
              )}
              {s.sokrashchenie.length === 0 ? null : (
                <details className="z1-sokr">
                  <summary className="z1-sokr__summary">{TRENAZHER_1.priznaki}</summary>
                  <ol className="z1-sokr__list">
                    {s.sokrashchenie.map((k, j) => (
                      <li key={j}>
                        <span dangerouslySetInnerHTML={{ __html: k.tekst }} />
                        {k.formula === '' ? null : (
                          <span
                            className="rich-formula"
                            dangerouslySetInnerHTML={{ __html: k.formula }}
                          />
                        )}
                      </li>
                    ))}
                  </ol>
                </details>
              )}
            </li>
          ))}
          <li className="rich-example__step is-check">
            <span className="rich-example__label">{TRENAZHER_1.sverka}</span>
            <p className="rich-p" dangerouslySetInnerHTML={{ __html: razbor.sverka }} />
          </li>
        </ol>
      </div>
      <p className="rich-example__answer">
        {TRENAZHER_1.otvetReshenie}: <span dangerouslySetInnerHTML={{ __html: razbor.otvetHtml }} />
      </p>
    </section>
  );
}
