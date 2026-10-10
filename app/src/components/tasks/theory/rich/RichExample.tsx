import { clsx } from 'clsx';
import { Fragment } from 'react';
import { Tex } from '@/components/ui/Tex';
import type { RichExample } from '@/content/theoryRich';
import { KatexFigure } from './KatexFigure';
import { Lines, Paras } from './parts';

export interface RichExampleBlockProps {
  block: RichExample;
  /**
   * Широкая колонка рисунка: на вкладке «О задании» колонки «Содержания»
   * нет, и рисунку разбора хватает места на крупные подписи.
   */
  wide?: boolean;
}

/**
 * Разобранный пример: условие, рисунок слева, шаги справа, проверка на
 * адекватность зелёной плашкой, «Ответ:» внизу. Один компонент на
 * теорию блоками (RichSection) и разборы типов задач на вкладке
 * «О задании» — оформление у них одно.
 */
export function RichExampleBlock({ block, wide = false }: RichExampleBlockProps) {
  return (
    <article className={clsx('rich-example', wide && 'rich-example--wide')}>
      <div className="rich-example__head">
        <h4 className="rich-example__title">
          <Tex text={block.title} />
        </h4>
        <p className="rich-example__condition">
          <Tex text={block.condition} />
        </p>
      </div>
      <div className="rich-example__grid">
        <KatexFigure id={block.figure} className="rich-example__figure" />
        <ol className="rich-example__steps">
          {block.steps.map((item) => (
            <li
              className={clsx('rich-example__step', item.check === true && 'is-check')}
              key={item.label}
            >
              <span className="rich-example__label">
                <Tex text={item.label} />
              </span>
              <Paras paras={item.paras} />
              <Lines lines={item.lines} />
              {(item.more ?? []).map((part, index) => (
                <Fragment key={index}>
                  <Paras paras={part.paras} />
                  <Lines lines={part.lines} />
                </Fragment>
              ))}
            </li>
          ))}
        </ol>
      </div>
      <p className="rich-example__answer">
        Ответ: <Tex text={block.answer} />
      </p>
    </article>
  );
}
