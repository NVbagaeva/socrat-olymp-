import { clsx } from 'clsx';
import { Fragment, type ReactNode } from 'react';
import { Tex } from '@/components/ui/Tex';
import type { RichBlock, RichSection as Section } from '@/content/theoryRich';
import { WarnIcon } from '../VerdictIcons';
import { Collapse } from './Collapse';
import { Display, Lines, Paras } from './parts';
import { RichExampleBlock } from './RichExample';
import { KatexFigure } from './KatexFigure';

/* Блок — обычная функция разметки, а не компонент: вложенные блоки
   (врезка, подраздел) зовут её же, ключ стоит на Fragment вокруг. */
function renderBlock(block: RichBlock): ReactNode {
  switch (block.type) {
    case 'text':
      return (
        <div className={clsx('rich-text', block.lead === true && 'rich-text--lead')}>
          <Paras paras={block.paras} />
        </div>
      );

    case 'main-formula':
      return (
        <div className={clsx('rich-main', block.figure !== undefined && 'rich-main--figure')}>
          <div className="rich-main__frame">
            <span className="rich-main__chip">
              <Tex text={block.chip} />
            </span>
            <div className="rich-main__body">
              <Display tex={block.formula} className="rich-main__formula" />
              <p className="rich-main__note">
                <Tex text={block.note} />
              </p>
            </div>
          </div>
          {block.figure === undefined ? null : (
            <KatexFigure id={block.figure} className="rich-main__figure" />
          )}
        </div>
      );

    case 'cards':
      return (
        <ul className={clsx('rich-cards', block.columns === 3 && 'rich-cards--3')}>
          {block.items.map((card) => (
            <li className="rich-card" key={card.id}>
              <h4 className="rich-card__title">
                <Tex text={card.title} />
              </h4>
              <Paras paras={card.paras} />
              <Lines lines={card.lines} />
              {card.figure === undefined ? null : (
                <KatexFigure id={card.figure} className="rich-card__figure" />
              )}
              {card.result === undefined ? null : (
                <div className="rich-card__result">
                  <Display tex={card.result.formula} />
                  {card.result.caption === undefined ? null : (
                    <span className="rich-card__caption">
                      <Tex text={card.result.caption} />
                    </span>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      );

    case 'steps':
      return (
        <ol className="rich-steps">
          {block.items.map((item) => (
            <li className="rich-step" key={item.no}>
              <span className="rich-step__no" aria-hidden="true">
                {item.no}
              </span>
              <div className="rich-step__body">
                <h4 className="rich-step__title">
                  <span className="sr-only">Шаг {item.no}. </span>
                  <Tex text={item.title} />
                </h4>
                <Paras paras={item.paras} />
                {item.fork === undefined ? null : (
                  <ul className="rich-fork">
                    {item.fork.map((branch) => (
                      <li
                        className={clsx('rich-fork__branch', `rich-fork__branch--${branch.tone}`)}
                        key={branch.label}
                      >
                        <span className="rich-fork__label" aria-hidden="true">
                          {branch.label}
                        </span>
                        <h5 className="rich-fork__title">
                          <Tex text={branch.title} />
                        </h5>
                        <Paras paras={branch.paras} />
                        {branch.figure === undefined ? null : (
                          <KatexFigure id={branch.figure} className="rich-fork__figure" />
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                {item.boxed === undefined ? null : (
                  <Display tex={item.boxed} className="rich-step__boxed" />
                )}
              </div>
            </li>
          ))}
        </ol>
      );

    case 'collapse':
      return (
        <Collapse
          title={<Tex text={block.title} />}
          {...(block.tag === undefined ? {} : { tag: <Tex text={block.tag} /> })}
        >
          {block.blocks.map((inner, index) => (
            <Fragment key={index}>{renderBlock(inner)}</Fragment>
          ))}
        </Collapse>
      );

    case 'example':
      return <RichExampleBlock block={block} />;

    case 'sub':
      return (
        <section className="rich-sub" id={block.id}>
          <h4 className="rich-sub__title">
            <span className="rich-sub__no">{block.no}</span>
            <Tex text={block.title} />
          </h4>
          {block.blocks.map((inner, index) => (
            <Fragment key={index}>{renderBlock(inner)}</Fragment>
          ))}
        </section>
      );

    case 'figure':
      return <KatexFigure id={block.figure} className="rich-figure" />;

    case 'remember':
      return (
        <section className="nofn-note nofn-note--warm rich-remember">
          <h4 className="nofn-note__title">
            <WarnIcon />
            {block.title ?? 'Запомни'}
          </h4>
          {block.paras.map((para) => (
            <p className="nofn-note__text" key={para}>
              <Tex text={para} />
            </p>
          ))}
        </section>
      );

    case 'memo':
      return (
        <ol className="rich-memo">
          {block.items.map((item) => (
            <li key={item}>
              <Tex text={item} />
            </li>
          ))}
        </ol>
      );

    default:
      return null;
  }
}

/**
 * Раздел теории, свёрстанный блоками (content/theoryRich.ts).
 *
 * Разметка одна на линейную функцию и график корня: разделы
 * различаются только данными. Формулы и подписи на рисунках набирает
 * KaTeX на сборке, чертежи рисует движок graph/.
 */
export function RichSection({ section }: { section: Section }) {
  return (
    <div className="rich">
      {section.blocks.map((block, index) => (
        <Fragment key={index}>{renderBlock(block)}</Fragment>
      ))}
    </div>
  );
}
