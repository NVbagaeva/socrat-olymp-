'use client';

import { clsx } from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { VARIANT_SCREEN as T, VARIANT_SHEET as S } from '@/content/variant';
import { katex } from '@/lib/graph/katex';
import { upgrade } from '@/lib/graph/katex-upgrade.js';
import { solutionLength, spaceFor, spaceHtml, type SheetSpace } from '@/lib/sheet/space.js';
import '@/lib/sheet/space.css';
import { dateRu, instructionFor, sheetNo, starsText } from '@/lib/variant/sheets';
import type { EgeNo, VariantMeta, VariantSet } from '@/lib/variant/types';

export interface VariantPreviewProps {
  set: VariantSet | null;
  meta: VariantMeta;
  title: string;
  busy: boolean;
  dev: boolean;
  /** Место для решения: поле — как на листе ученика. */
  space: SheetSpace;
  onReplace: (variant: number, ege: EgeNo) => void;
}

/**
 * Предпросмотр листа ученика: тот же набор, что уйдёт в печать, —
 * шапка, инструкция, задания с рисунками и бланк ответов. Над каждой
 * задачей — служебная строка экрана (на лист не идёт): источник,
 * сложность и кнопка «заменить»; в режиме разработчика — поля,
 * взятые из запасного варианта.
 */
export function VariantPreview({
  set,
  meta,
  title,
  busy,
  dev,
  space,
  onReplace,
}: VariantPreviewProps) {
  const [tab, setTab] = useState(0);
  const paper = useRef<HTMLDivElement>(null);
  /* Вариантов стало меньше — показывается последний. */
  const active = Math.min(tab, (set?.variants.length ?? 1) - 1);
  const variant = set?.variants[active] ?? null;

  /* Формулы-заглушки (.math) набираются KaTeX после отрисовки. */
  useEffect(() => {
    if (paper.current !== null) upgrade(paper.current, katex);
  }, [variant, meta.numbering]);

  return (
    <section className="var-panel var-preview" aria-labelledby="var-preview-h" aria-busy={busy}>
      <div className="var-panel__head">
        <h2 id="var-preview-h" className="var-panel__title">
          {T.preview}
        </h2>
        {set !== null && set.variants.length > 1 ? (
          <div className="var-tabs" role="tablist" aria-label={T.preview}>
            {set.variants.map((v, i) => (
              <button
                key={v.index}
                type="button"
                role="tab"
                aria-selected={i === active}
                className={clsx('var-tabs__btn', i === active && 'is-active')}
                onClick={() => setTab(i)}
              >
                {T.variantTab(v.index)}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {variant === null ? (
        <p className="var-preview__empty">{T.previewEmpty}</p>
      ) : (
        <div className="var-paper" ref={paper}>
          <header className="var-paper__head">
            <span className="var-paper__chip">{S.chip.uchenik}</span>
            <div className="var-paper__title">
              <p className="var-paper__work">{title}</p>
              {meta.topic.trim() === '' ? null : <p className="var-paper__topic">{meta.topic}</p>}
            </div>
            <span className="var-paper__variant">
              {meta.variantLabels === 'blank' ? S.variantBlank : S.variant(variant.index)}
            </span>
          </header>
          <p className="var-paper__fields">
            <span>Фамилия, имя ______________</span>
            <span>Класс {meta.group.trim() || '______'}</span>
            <span>Дата {meta.date === '' ? '______' : dateRu(meta.date)}</span>
            {meta.duration.trim() === '' ? null : (
              <span>
                {S.duration}: {meta.duration}
              </span>
            )}
            {meta.teacher.trim() === '' ? null : (
              <span>
                {S.teacher}: {meta.teacher}
              </span>
            )}
          </p>
          {meta.instruction && instructionFor(meta) !== '' ? (
            <p className="var-paper__instruction">{instructionFor(meta)}</p>
          ) : null}

          <ol className="var-paper__tasks">
            {variant.tasks.map((t, i) => {
              const no = sheetNo(t, i, meta.numbering);
              return (
                <li key={`${t.egeNumber}:${t.taskId}`} className="var-task">
                  <div className="var-task__bar">
                    <span className="var-task__meta">
                      №{t.egeNumber} · {t.source.label}
                    </span>
                    {/* Сложность — только здесь, на экране: на листы она не печатается. */}
                    <span
                      className={clsx(
                        'var-task__level',
                        t.difficulty === null && 'var-task__level--none',
                      )}
                    >
                      {starsText(t.difficulty)}
                    </span>
                    <button
                      type="button"
                      className="var-task__replace"
                      aria-label={`${T.replace} ${no}`}
                      title={T.replace}
                      disabled={busy}
                      onClick={() => onReplace(variant.index, t.egeNumber)}
                    >
                      <svg viewBox="0 0 20 20" aria-hidden="true">
                        <path d="M15.5 8A6 6 0 0 0 4.6 6.2M4.5 12a6 6 0 0 0 10.9 1.8" />
                        <path d="M15.8 3.5v4.7h-4.7M4.2 16.5v-4.7h4.7" />
                      </svg>
                    </button>
                  </div>
                  {dev && t.fallbacks.length > 0 ? (
                    <ul className="var-task__dev" aria-label={T.devNote}>
                      {t.fallbacks.map((f, k) => (
                        <li key={k}>
                          <b>{f.field}</b>: {f.note}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <div className="var-task__body">
                    <span className="var-task__no">{no}</span>
                    <div
                      className="var-task__text"
                      dangerouslySetInnerHTML={{ __html: t.statement }}
                    />
                    {t.figure === null ? null : (
                      <div
                        className={clsx('var-task__fig', t.figure.below === true && 'is-below')}
                        style={
                          t.figure.width === undefined
                            ? undefined
                            : { maxWidth: `${t.figure.width * 3.2}px` }
                        }
                        dangerouslySetInnerHTML={{ __html: t.figure.svg }}
                      />
                    )}
                    {/* Место для решения — та же разметка, что на листе (space.js). */}
                    {(() => {
                      const field = spaceFor(
                        space,
                        t.egeNumber,
                        solutionLength(t.solutionTeacher ?? t.solutionStudent),
                      );
                      return field === null ? null : (
                        <div
                          className="var-task__space"
                          dangerouslySetInnerHTML={{
                            __html: spaceHtml(field, field.rows, true, true),
                          }}
                        />
                      );
                    })()}
                    <p className="var-task__answer">
                      {S.answer}:<span className="var-task__blank" />
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </section>
  );
}
