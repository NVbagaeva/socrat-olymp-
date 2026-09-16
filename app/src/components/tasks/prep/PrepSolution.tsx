'use client';

import { useState } from 'react';
import { clsx } from 'clsx';
import { Button } from '@/components/ui';
import type { PrepBlock, PrepStep } from '@/lib/prep';
import { HintIcon } from './PrepIcons';

export interface PrepSolutionProps {
  /** Шаги разбора. Пусто — движок его для этой задачи не строит. */
  steps: PrepStep[] | null;
  /** Приём для плашки «Запомни!»: приходит из описания навыка. */
  tip: string;
  /** Номер открытого шага, 0…N−1. */
  step: number;
  onStep: (next: number) => void;
  /** Свернуть разбор и вернуться к заданию. */
  onClose: () => void;
}

/* Стрелка направления прямой. Движок ставит её только первому шагу
   и только когда знает, вверх прямая или вниз. */
function ArrowIcon({ up }: { up: boolean }) {
  return (
    <svg className="solution-arrow" width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
      <path
        d={`M4 ${up ? 17 : 5}L18 ${up ? 5 : 17}`}
        stroke="var(--color-primary)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d={up ? 'M12 5H18V11' : 'M12 17H18V11'}
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* Раскрывающаяся врезка вроде «Откуда берётся минус». Оформление
   и раскрытие уже описаны в graph.css — здесь только состояние. */
function Details({ title, blocks }: { title: string; blocks: PrepBlock[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={clsx('solution-details', open && 'open')}>
      <button
        type="button"
        className="solution-details-toggle"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {title}
      </button>
      <div className="solution-details-body">
        <div>
          <Blocks blocks={blocks} />
        </div>
      </div>
    </div>
  );
}

/**
 * Блоки шага.
 *
 * Имена классов — те же, что у движка: оформление выкладок,
 * врезок и ключевых чисел уже описано в graph.css, второго набора
 * правил для того же самого заводить незачем.
 */
function Blocks({ blocks }: { blocks: PrepBlock[] }) {
  return (
    <>
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`;

        if (block.type === 'text') {
          return (
            <p key={key} className="solution-text" dangerouslySetInnerHTML={{ __html: block.html }} />
          );
        }
        if (block.type === 'formula') {
          return (
            <p
              key={key}
              className={clsx('solution-formula', block.feature && 'feature')}
              dangerouslySetInnerHTML={{ __html: block.html }}
            />
          );
        }
        if (block.type === 'answer') {
          return (
            <p
              key={key}
              className="solution-answer"
              dangerouslySetInnerHTML={{ __html: block.html }}
            />
          );
        }
        if (block.type === 'chart') {
          return (
            <span key={key} className="chart" dangerouslySetInnerHTML={{ __html: block.svg }} />
          );
        }
        if (block.type === 'callout') {
          return (
            <div key={key} className="solution-callout">
              <p className="solution-callout-title">{block.title}</p>
              <Blocks blocks={block.blocks} />
            </div>
          );
        }
        return <Details key={key} title={block.title} blocks={block.blocks} />;
      })}
    </>
  );
}

/**
 * Разбор решения по шагам.
 *
 * Шаги, их заголовки и все выкладки приходят из движка вместе
 * с задачей: числа в разборе — те же, что в условии. Сколько шагов
 * пришло, столько и показано — ни одного не зашито в разметке.
 */
export function PrepSolution({ steps, tip, step, onStep, onClose }: PrepSolutionProps) {
  const current = steps === null ? null : (steps[step] ?? steps[0] ?? null);
  const total = steps === null ? 0 : steps.length;
  const last = step >= total - 1;

  return (
    <section className="psol">
      {steps === null || current === null ? (
        /* Разбор строится по треугольнику наклона, а у прямой без
           наклона его нет. Придумывать шаги вместо движка нельзя. */
        <p className="psol__none">Для этой задачи разбор с чертежом не строится.</p>
      ) : (
        <div className="psol__cols">
          <ol className="psol__steps">
            {steps.map((item, i) => (
              <li key={item.number}>
                <button
                  type="button"
                  className={clsx('pstep', i < step && 'is-done', i === step && 'is-current')}
                  aria-current={i === step ? 'step' : undefined}
                  onClick={() => onStep(i)}
                >
                  <span className="pstep__mark" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                      <path d="M5 12.5 10 17.5 19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span className="pstep__text">
                    <span className="pstep__no">Шаг {item.number}</span>
                    <span className="pstep__title">{item.title}</span>
                  </span>
                </button>
              </li>
            ))}
          </ol>

          <div className="psol__stage">
            <article className="solution-step">
              <div className="solution-number" aria-hidden="true">
                {current.number}
              </div>
              <div>
                <div className="solution-head">
                  <h3 className="solution-title">{current.title}</h3>
                  {current.arrow === null ? null : <ArrowIcon up={current.arrow === 'up'} />}
                </div>
                <Blocks blocks={current.blocks} />
              </div>
            </article>

            <div className="psol__nav">
              <Button variant="ghost" onClick={onClose}>
                ← К заданию
              </Button>
              <ol className="psol__dots" aria-hidden="true">
                {steps.map((item, i) => (
                  <li key={item.number} className={clsx('psol__dot', i === step && 'is-current')} />
                ))}
              </ol>
              {last ? null : (
                <Button onClick={() => onStep(step + 1)}>Далее: Шаг {step + 2} →</Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Приём запоминается лучше вывода: он про то, как делать,
          а не про то, что получилось. */}
      <aside className="psol__tip">
        <p className="psol__tip-head">
          <HintIcon />
          Запомни!
        </p>
        <p className="psol__tip-text">{tip}</p>
      </aside>
    </section>
  );
}
