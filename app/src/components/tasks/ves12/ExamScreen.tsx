'use client';

import { useEffect, useId, useState } from 'react';
import { clsx } from 'clsx';
import { Button, Input, Modal } from '@/components/ui';
import { parseAnswer, sameNumber } from '@/lib/answer';
import type { BaseUi } from '@/lib/trainerSession/types';
import { examText } from '@/content/ves12';
import type { ExamItem } from '@/lib/ves12/build';
import { useBeforeFinish } from '../session/useBeforeFinish';
import { useSessionReport } from '../session/useSessionReport';

/** Состояние экрана работы: сверх общего — ответы по номерам задач. */
export interface ExamUi extends BaseUi {
  answers: Record<number, string>;
}

export interface ExamScreenProps {
  items: ExamItem[];
  restored: ExamUi | null;
  report: (ui: ExamUi) => void;
  elapsed: () => number;
  finish: () => void;
  setBeforeFinish: (handler: (() => void) | null) => void;
  /** Время на работу, мс. */
  limitMs: number;
  /** Ответы ученика — для разбора на экране итогов. */
  onAnswers: (answers: Record<number, string>) => void;
}

/** Верный ли ответ: число — с точностью до записи, выбор — по номеру. */
export function answerRight(item: ExamItem, value: string | undefined): boolean {
  if (value === undefined || value.trim() === '') {
    return false;
  }
  return item.task.options === null ? sameNumber(value, item.task.answer) : value === item.task.answer;
}

/** Отметки для итогов: верно — marks, неверно — tried, без ответа — пропуск. */
export function examMarks(items: ExamItem[], answers: Record<number, string>) {
  const marks: BaseUi['marks'] = {};
  const tried: BaseUi['tried'] = {};
  items.forEach((item, i) => {
    const value = answers[i];
    if (answerRight(item, value)) {
      marks[i] = 'right';
    } else if (value !== undefined && value.trim() !== '') {
      tried[i] = true;
    }
  });
  return { marks, tried };
}

function clock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Экран онлайн-работы: задача, чертёж, поле ответа и номера всех задач.
 *
 * Ни подсказок, ни проверки во время работы: ответ просто сохраняется,
 * задачи можно пропускать и возвращаться к ним. Верно или нет — станет
 * видно только после «Завершить работу». Время идёт назад; когда оно
 * кончилось, работа завершается сама.
 */
export function ExamScreen({
  items,
  restored,
  report,
  elapsed,
  finish,
  setBeforeFinish,
  limitMs,
  onAnswers,
}: ExamScreenProps) {
  const fieldId = useId();
  const [index, setIndex] = useState(restored?.index ?? 0);
  const [answers, setAnswers] = useState<Record<number, string>>(restored?.answers ?? {});
  const [draft, setDraft] = useState(answers[restored?.index ?? 0] ?? '');
  const [confirm, setConfirm] = useState(false);
  const [left, setLeft] = useState(limitMs);

  const item = items[index] ?? items[0];
  const answered = (i: number) => (answers[i] ?? '').trim() !== '';
  const empty = items.filter((_, i) => !answered(i)).length;

  /* Отметки появляются только при завершении: во время работы ученик
     не видит, где ошибся. */
  useSessionReport(report, { index, marks: {}, tried: {}, order: null, answers });
  useBeforeFinish(setBeforeFinish, () => {
    report({ index, order: null, answers, ...examMarks(items, answers) });
  });
  useEffect(() => {
    onAnswers(answers);
  }, [answers, onAnswers]);

  /* Обратный отсчёт по активному времени оболочки. */
  useEffect(() => {
    const tick = () => setLeft(limitMs - elapsed());
    tick();
    const timer = window.setInterval(tick, 500);
    return () => window.clearInterval(timer);
  }, [elapsed, limitMs]);
  useEffect(() => {
    if (left <= 0) {
      finish();
    }
  }, [left, finish]);

  function save(value: string) {
    setAnswers((prev) => {
      const next = { ...prev };
      if (value.trim() === '') {
        delete next[index];
      } else {
        next[index] = value.trim();
      }
      return next;
    });
  }

  function go(to: number) {
    /* Введённое, но не сохранённое не теряется: уходя с задачи,
       сохраняем поле. */
    save(draft);
    setIndex(to);
    setDraft(answers[to] ?? '');
  }

  if (item === undefined) {
    return null;
  }
  const choice = item.task.options;
  const saved = answers[index] ?? '';
  const numberOk = draft.trim() === '' || parseAnswer(draft) !== null;

  return (
    <div className="exam">
      <div className={clsx('exam__timer', left <= 60000 && 'is-low')} role="timer" aria-live="off">
        {left > 0 ? examText.left(clock(left)) : examText.over}
      </div>

      <nav className="exam__nav" aria-label={examText.nav}>
        <ol>
          {items.map((entry, i) => (
            <li key={`${entry.setId}-${i}`}>
              <button
                type="button"
                className={clsx('exam__no', i === index && 'is-current', answered(i) && 'is-answered')}
                aria-current={i === index ? 'step' : undefined}
                aria-label={`Задача ${i + 1}${answered(i) ? `, ${examText.answered}` : ''}`}
                onClick={() => go(i)}
              >
                {i + 1}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <article className="exam__task">
        <p className="exam__kind">
          Задача {index + 1} · {item.typeTitle}
        </p>
        <div className="exam__question" dangerouslySetInnerHTML={{ __html: item.task.questionHtml }} />
        {item.task.chartSvg === null ? null : (
          <div className="exam__chart" dangerouslySetInnerHTML={{ __html: item.task.chartSvg }} />
        )}

        <form
          className="exam__answer"
          onSubmit={(event) => {
            event.preventDefault();
            save(draft);
          }}
        >
          {choice === null ? (
            <>
              <label className="exam__label" htmlFor={fieldId}>
                {examText.answer}
              </label>
              <div className="exam__field">
                <Input
                  id={fieldId}
                  inputMode="decimal"
                  autoComplete="off"
                  value={draft}
                  placeholder={examText.answerPlaceholder}
                  state={numberOk ? 'default' : 'error'}
                  onChange={(event) => {
                    const value = event.target.value;
                    setDraft(value);
                    /* Ответ сохраняется сразу: время может кончиться
                       посреди ввода, и сохранённое не потеряется. */
                    if (value.trim() === '' || parseAnswer(value) !== null) {
                      save(value);
                    }
                  }}
                  data-testid="exam-input"
                />
                <Button type="submit" variant="secondary" disabled={!numberOk}>
                  {examText.save}
                </Button>
              </div>
            </>
          ) : (
            <fieldset className="exam__options">
              <legend className="exam__label">{examText.answer}</legend>
              {choice.map((option) => (
                <label key={option.number} className={clsx('exam__option', draft === option.number && 'is-checked')}>
                  <input
                    type="radio"
                    name={`exam-${index}`}
                    checked={draft === option.number}
                    onChange={() => {
                      setDraft(option.number);
                      save(option.number);
                    }}
                  />
                  <span className="exam__option-no">{option.number})</span>
                  <span dangerouslySetInnerHTML={{ __html: option.html }} />
                </label>
              ))}
            </fieldset>
          )}
          <p className="exam__saved" aria-live="polite">
            {saved !== '' && saved === draft.trim() ? examText.saved : ''}
          </p>
        </form>

        <div className="exam__moves">
          <Button variant="ghost" disabled={index === 0} onClick={() => go(index - 1)}>
            {examText.prev}
          </Button>
          {index < items.length - 1 ? (
            <>
              <Button variant="ghost" onClick={() => go(index + 1)} data-testid="exam-skip">
                {examText.skip}
              </Button>
              <Button onClick={() => go(index + 1)} data-testid="exam-next">
                {examText.next}
              </Button>
            </>
          ) : null}
          <Button
            variant="danger"
            onClick={() => {
              save(draft);
              setConfirm(true);
            }}
            data-testid="exam-finish"
          >
            {examText.finish}
          </Button>
        </div>
      </article>

      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title={examText.finishTitle}
        description={examText.finishText(empty - (draft.trim() !== '' && !answered(index) ? 1 : 0))}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirm(false)}>
              {examText.cancel}
            </Button>
            <Button variant="danger" onClick={finish} data-testid="exam-confirm">
              {examText.finish}
            </Button>
          </>
        }
      />
    </div>
  );
}
