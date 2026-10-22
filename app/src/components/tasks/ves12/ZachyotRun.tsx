'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui';
import { isRecord } from '@/lib/trainerSession/restore';
import { examText, zachyotText } from '@/content/ves12';
import { buildWork, examItems, type ExamItem } from '@/lib/ves12/build';
import {
  codeOutdated,
  gradeLines,
  gradeOf,
  minutesLabel,
  parseWorkQuery,
  percentOf,
  planWork,
  tasksLabel,
  type WorkParams,
} from '@/lib/ves12/work';
import type { Ves12Catalog } from '@/lib/ves12/types';
import { TrainerSessionHost } from '../session';
import { TrainerReview } from '../trainer/TrainerReview';
import { ExamScreen, answerRight, type ExamUi } from './ExamScreen';

export interface ZachyotRunProps {
  catalog: Ves12Catalog;
}

/** Задания работы в сессии: адрес работы и вариант; задачи — собранные. */
interface ExamPayload {
  query: string;
  variant: number;
  items: ExamItem[];
}

/** В хранилище — только адрес и вариант: задачи собираются заново по коду. */
interface PackedExam {
  exam: 1;
  query: string;
  variant: number;
}

function isPayload(value: unknown): value is ExamPayload {
  return (
    isRecord(value) &&
    typeof value['query'] === 'string' &&
    typeof value['variant'] === 'number' &&
    Array.isArray(value['items']) &&
    value['items'].length > 0
  );
}

function itemsOf(params: WorkParams, catalog: Ves12Catalog, variant: number): ExamItem[] {
  const built = buildWork(params, catalog);
  const found = built.variants.find((item) => item.no === variant);
  return found === undefined ? [] : examItems(found);
}

/**
 * Онлайн-режим зачётной работы для ученика.
 *
 * Варианты собираются из адреса работы — тот же код, те же задачи, что
 * у учителя на листе. Вариант задаёт ссылка (var=2) или выбирает сам
 * ученик — номер назовёт учитель. Незавершённая работа сохраняется
 * общей оболочкой тренажёров (TrainerSessionHost): закрыл вкладку —
 * вернулся к тем же ответам. Подсказок и разборов до завершения нет.
 */
export function ZachyotRun({ catalog }: ZachyotRunProps) {
  const query = useSearchParams();
  const params = useMemo(() => parseWorkQuery(query), [query]);
  const fixed = Number(query.get('var'));
  const [variant, setVariant] = useState<number>(
    Number.isInteger(fixed) && fixed >= 1 ? fixed : 1,
  );
  const [building, setBuilding] = useState(false);
  /* Ответы последней работы — для разбора на экране итогов. */
  const answersRef = useRef<Record<number, string>>({});
  const onAnswers = useCallback((answers: Record<number, string>) => {
    answersRef.current = answers;
  }, []);

  if (params === null) {
    return <p className="exam-bad">{examText.bad}</p>;
  }
  const work = params;
  const workQueryText = (() => {
    const copy = new URLSearchParams(query);
    copy.delete('var');
    return copy.toString();
  })();
  const variantFixed = Number.isInteger(fixed) && fixed >= 1 && fixed <= work.variants;
  const perVariant = planWork(work, catalog).perVariant;

  return (
    <TrainerSessionHost<ExamPayload, ExamUi>
      scope={`${examText.scopePrefix}:${work.code}`}
      what="зачётная работа"
      isPayload={isPayload}
      count={(payload) => payload.items.length}
      describe={(payload, at) => {
        const item = payload.items[at];
        if (item === undefined) {
          return { kind: examText.typeCol, html: '' };
        }
        return {
          kind: item.typeTitle,
          html: item.task.questionHtml,
          code: item.setId,
          review: () => {
            const mine = answersRef.current[at];
            return (
              <div className="exam-review">
                <p>
                  {examText.yourAnswer}:{' '}
                  <b className={answerRight(item, mine) ? 'is-right' : 'is-wrong'}>
                    {mine === undefined || mine === '' ? examText.noAnswer : mine}
                  </b>
                </p>
                <TrainerReview task={item.task} />
              </div>
            );
          },
        };
      }}
      pack={(payload): PackedExam => ({ exam: 1, query: payload.query, variant: payload.variant })}
      unpack={(packed) => {
        if (!isRecord(packed) || packed['exam'] !== 1 || typeof packed['query'] !== 'string') {
          return null;
        }
        const saved = parseWorkQuery(new URLSearchParams(packed['query']));
        const no = Number(packed['variant']);
        if (saved === null || !Number.isInteger(no)) {
          return null;
        }
        const items = itemsOf(saved, catalog, no);
        return items.length === 0 ? null : { query: packed['query'], variant: no, items };
      }}
      labels={{
        solved: examText.answered,
        progress: (ui) => Object.values(ui.answers).filter((value) => value.trim() !== '').length,
        finish: examText.finish,
        finishLong: examText.finish,
        finishTitle: examText.finishTitle,
        finishText: () => examText.finishShort,
        finishCancel: examText.cancel,
        pausable: false,
        clock: false,
        summary: {
          title: examText.resultTitle,
          lead: `${work.title}`,
          kinds: examText.byType,
          newTraining: examText.again,
          scoreLabel: examText.score,
        },
      }}
      summary={{
        extra: (data) => {
          const right = data.items.filter((item) => item.mark === 'right').length;
          const total = data.items.length;
          const grade = gradeOf(right, total, work.grades);
          return (
            <div className="exam-result" data-testid="exam-result">
              <p className="exam-result__grade">
                <span className="exam-result__label">{examText.grade}</span>
                <span className={`exam-result__mark exam-result__mark--${grade}`} data-testid="exam-grade">
                  {grade}
                </span>
                <span className="exam-result__score">
                  {right} из {total} · {percentOf(right, total)}%
                </span>
              </p>
              <ul className="exam-result__scale">
                {gradeLines(work.grades, total).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <p className="exam-result__note">{examText.screenshot}</p>
            </div>
          );
        },
      }}
      configurator={({ start }) => (
        <section className="exam-start">
          <h2 className="exam-start__title">{work.title}</h2>
          <p className="exam-start__meta">
            {work.teacher === '' ? null : (
              <>
                {examText.teacher(work.teacher)}
                <br />
              </>
            )}
            {examText.time(minutesLabel(work.minutes))} · {tasksLabel(perVariant)}
          </p>
          {codeOutdated(work.code) ? <p className="exam-start__warn">{zachyotText.outdated}</p> : null}
          {variantFixed ? (
            <p className="exam-start__variant">{examText.variant(fixed)}</p>
          ) : work.variants > 1 ? (
            <div className="exam-start__choose" role="radiogroup" aria-label={examText.chooseTitle}>
              <p className="exam-start__label">{examText.chooseTitle}</p>
              <p className="exam-start__hint">{examText.chooseLead}</p>
              <div className="exam-start__variants">
                {Array.from({ length: work.variants }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={variant === n}
                    className={variant === n ? 'exam-variant is-checked' : 'exam-variant'}
                    onClick={() => setVariant(n)}
                  >
                    {examText.variant(n)}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          <ul className="exam-start__rules">
            {examText.rules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
          <Button
            loading={building}
            data-testid="exam-start"
            onClick={() => {
              setBuilding(true);
              /* Движок считает задачи синхронно: отдаём кадр кнопке,
                 чтобы ожидание было видно. */
              window.setTimeout(() => {
                const no = variantFixed ? fixed : variant;
                const items = itemsOf(work, catalog, no);
                setBuilding(false);
                if (items.length > 0) {
                  answersRef.current = {};
                  start({ query: workQueryText, variant: no, items });
                }
              }, 30);
            }}
          >
            {examText.start}
          </Button>
        </section>
      )}
      screen={(context) => (
        <>
          <p className="exam-head">
            {work.title} · {examText.variant(context.payload.variant)}
          </p>
          <ExamScreen
            items={context.payload.items}
            restored={context.restored}
            report={context.report}
            elapsed={context.elapsed}
            finish={context.finish}
            setBeforeFinish={context.setBeforeFinish}
            limitMs={work.minutes * 60_000}
            onAnswers={onAnswers}
          />
        </>
      )}
    />
  );
}
