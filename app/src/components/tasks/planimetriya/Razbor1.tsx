import { clsx } from 'clsx';
import { FigureZoom } from '@/components/ui';
import { Tex } from '@/components/ui/Tex';
import { Display, Paras } from '@/components/tasks/theory/rich/parts';
import { RAZBOR_1 } from '@/content/zadanie1';
import { POROG } from '@/lib/planimetriya/figury';
import { renderPlan } from '@/lib/planimetriya/render';
import { reshenie } from '@/lib/planimetriya/reshenie';
import { prototip } from '@/lib/planimetriya/stseny';
import type { Params } from '@/lib/planimetriya/stseny/dsl';
import { chislo } from '@/lib/planimetriya/stseny/dsl';

export interface Razbor1Props {
  proto: number;
  params: Params;
  /** Заголовок: «Задача 13 открытого банка» или «Пример». */
  title: string;
  /** Широкая колонка рисунка (на «О задании» нет колонки содержания). */
  wide?: boolean;
  id?: string;
}

/**
 * Разобранная задача №1: условие, чертёж со всеми построениями,
 * решение по шагам с подписями этапов, выкладки KaTeX, сокращение «с
 * умом» в раскрывающейся панели и сверка ответа с рисунком.
 * Оформление — разобранный пример теории (rich-example), как у
 * разборов квадратичной функции.
 */
export function Razbor1({ proto, params, title, wide = false, id }: Razbor1Props) {
  const p = prototip(proto);
  const r = reshenie(proto, params);
  const svg = renderPlan(p.stsena(params, POROG), {
    rezhim: { rezhim: 'uchitel' },
    chisla: true,
    alt: `Чертёж к задаче: ${p.nazvanie.replace(/\$/g, '')}`,
  });
  return (
    <article className={clsx('rich-example z1-razbor', wide && 'rich-example--wide')} id={id}>
      <div className="rich-example__head">
        <h4 className="rich-example__title">
          {title}
          {p.fipi.length === 0 ? <span className="z1-metka">{RAZBOR_1.neIzBanka}</span> : null}
        </h4>
        <p className="rich-example__condition">
          <Tex text={p.uslovie(params)} />
        </p>
      </div>
      <div className="rich-example__grid">
        <FigureZoom
          className="rich-example__figure z1-razbor__pic"
          label={RAZBOR_1.risunok}
        >
          <span className="pl-wrap" dangerouslySetInnerHTML={{ __html: svg }} />
        </FigureZoom>
        <ol className="rich-example__steps">
          {r.shagi.map((s) => (
            <li className="rich-example__step" key={s.zagolovok}>
              <span className="rich-example__label">
                <Tex text={s.zagolovok} />
              </span>
              <Paras paras={s.tekst.filter((x) => x !== '')} />
              {s.formuly === undefined ? null : (
                <div className="rich-lines">
                  {s.formuly.map((f) => (
                    <Display tex={f} key={f} />
                  ))}
                </div>
              )}
              {s.sokrashchenie === undefined ? null : (
                <details className="z1-sokr">
                  <summary className="z1-sokr__summary">{RAZBOR_1.priznaki}</summary>
                  <ol className="z1-sokr__list">
                    {s.sokrashchenie.map((k, i) => (
                      <li key={i}>
                        <Tex text={k.tekst} />
                        {k.tex === '' ? null : <Display tex={k.tex} />}
                      </li>
                    ))}
                  </ol>
                </details>
              )}
            </li>
          ))}
          <li className="rich-example__step is-check">
            <span className="rich-example__label">{RAZBOR_1.sverka}</span>
            <p className="rich-p">
              <Tex text={r.sverka} />
            </p>
          </li>
        </ol>
      </div>
      <p className="rich-example__answer">
        Ответ: <Tex text={`$${chislo(r.otvet).replace(',', '{,}')}$`} />
      </p>
    </article>
  );
}
