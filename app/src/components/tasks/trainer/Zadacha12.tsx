'use client';

import { Fragment } from 'react';
import { clsx } from 'clsx';
import { Button, FigureZoom, Input } from '@/components/ui';
import type { KartochkaRazdela, Shagi } from '@/components/trenazher/types';
import { parseAnswer, sameNumber } from '@/lib/answer';
import type { TrainerPart, TrainerQuestion, TrainerStep, TrainerTask } from '@/lib/trainer';
import { recordAttempt } from '@/lib/trainerProgress';
import { RightIcon } from '../prep/PrepIcons';
import { TrainerReview } from './TrainerReview';

/**
 * Карточка задачи №12 в общем тренажёре: условие с чертежом движка,
 * ответ числом или выбором варианта, подсказка по шагам (поля,
 * вопросы с кнопками, части у параболы) и разбор — тот же, что в
 * опорных задачах. Попытки, режимы, лента и итоги — общие
 * (components/trenazher/).
 */

/** Состояние подсказки: шаг, поля, отметка шага, вопросы и части. */
interface Hint {
  step: number;
  fields: Record<string, string>;
  mark: 'right' | 'wrong' | null;
  answered: number;
  picked: number | null;
  note: string | null;
}

function hintOf(shagi: Shagi | null): Hint {
  const raw = shagi ?? {};
  const num = (v: unknown) => (typeof v === 'number' && Number.isInteger(v) && v >= 0 ? v : 0);
  const fields: Record<string, string> = {};
  if (typeof raw['fields'] === 'object' && raw['fields'] !== null) {
    for (const [k, v] of Object.entries(raw['fields'] as Record<string, unknown>)) {
      if (typeof v === 'string') fields[k] = v;
    }
  }
  const mark = raw['mark'];
  return {
    step: num(raw['step']),
    fields,
    mark: mark === 'right' || mark === 'wrong' ? mark : null,
    answered: num(raw['answered']),
    picked: typeof raw['picked'] === 'number' ? raw['picked'] : null,
    note: typeof raw['note'] === 'string' ? raw['note'] : null,
  };
}

function Uslovie12({
  task,
  nomer,
  shagi,
}: {
  task: TrainerTask;
  nomer: number;
  shagi: Shagi | null;
}) {
  const h = shagi === null ? null : hintOf(shagi);
  const current: TrainerStep | undefined = h === null ? undefined : task.steps[h.step];
  /* Шаг подсказки может подсветить свою асимптоту или достроить чертёж. */
  const svg =
    h !== null && current?.chartSvg !== undefined && h.answered >= (current.chartFrom ?? 0)
      ? current.chartSvg
      : task.chartSvg;
  return (
    <div className="ptask__text trz12">
      <div className="ptask__question" dangerouslySetInnerHTML={{ __html: task.questionHtml }} />
      {svg === null ? null : (
        <FigureZoom className="chart ptask__chart" label={`Чертёж к задаче ${nomer}`}>
          <span
            data-focus={(h !== null && current?.focus) || undefined}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        </FigureZoom>
      )}
    </div>
  );
}

function Otvet12({
  task,
  value,
  onChange,
  proverka,
  disabled,
  labelId,
}: {
  task: TrainerTask;
  value: string;
  onChange: (v: string) => void;
  proverka: 'right' | 'wrong' | null;
  disabled: boolean;
  labelId: string;
}) {
  if (task.options === null) {
    return (
      <Input
        className="ttask__input"
        value={value}
        state={proverka === null ? 'default' : proverka === 'right' ? 'success' : 'error'}
        inputMode="text"
        autoComplete="off"
        aria-labelledby={labelId}
        readOnly={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }
  return (
    <ul className="ptask__options" aria-labelledby={labelId}>
      {task.options.map((option) => (
        <li key={option.number}>
          <button
            type="button"
            className={clsx(
              'popt',
              value === option.number && 'is-chosen',
              value === option.number && proverka !== null && `is-${proverka}`,
            )}
            aria-pressed={value === option.number}
            disabled={disabled}
            onClick={() => onChange(option.number)}
          >
            <span className="popt__no">{option.number}</span>
            <span className="popt__text" dangerouslySetInnerHTML={{ __html: option.html }} />
          </button>
        </li>
      ))}
    </ul>
  );
}

function Podskazka12({
  task,
  shagi,
  setShagi,
  onMiss,
  onDone,
}: {
  task: TrainerTask;
  shagi: Shagi;
  setShagi: (next: Shagi) => void;
  onMiss: () => void;
  onDone: () => void;
}) {
  const h = hintOf(shagi);
  const steps = task.steps;
  const current: TrainerStep | undefined = steps[h.step];
  const set = (next: Partial<Hint>) => setShagi({ ...h, ...next });

  const fieldValue = (stepNo: number, fieldNo: number) => h.fields[`${stepNo}:${fieldNo}`] ?? '';
  const partValue = (stepNo: number, partNo: number, fieldNo: number) =>
    h.fields[`${stepNo}:${partNo}:${fieldNo}`] ?? '';

  /* Шаг пройден: следующий, а после последнего — задача решена. */
  function advance() {
    set({ step: h.step + 1, mark: null, answered: 0, picked: null, note: null });
    if (h.step + 1 >= steps.length) onDone();
  }

  function checkStep() {
    if (current === undefined) return;
    const sets = [current.fields.map((field) => field.answer), ...(current.variants ?? [])];
    const right = sets.some((answers) =>
      answers.every((answer, fieldNo) => sameNumber(fieldValue(h.step, fieldNo), answer)),
    );
    if (!right) {
      set({ mark: 'wrong' });
      onMiss();
      return;
    }
    advance();
  }

  function pickOption(optionNo: number) {
    const question = current?.questions?.[h.answered];
    if (question === undefined) return;
    if (question.options[optionNo]?.right !== true) {
      set({ picked: optionNo });
      onMiss();
      return;
    }
    if (h.answered + 1 < (current?.questions?.length ?? 0)) {
      set({ answered: h.answered + 1, picked: null });
      return;
    }
    advance();
  }

  function nextPart() {
    if (h.answered + 1 < (current?.parts?.length ?? 0)) {
      set({ answered: h.answered + 1, mark: null, picked: null, note: null });
      return;
    }
    advance();
  }

  function checkPart() {
    const part = current?.parts?.[h.answered];
    if (part === undefined || part.kind !== 'fields') return;
    const values = part.fields.map((_, fieldNo) => partValue(h.step, h.answered, fieldNo));
    const sets = [part.fields.map((field) => field.answer), ...(part.variants ?? [])];
    const right = sets.some((answers) =>
      answers.every((answer, fieldNo) => sameNumber(values[fieldNo] ?? '', answer)),
    );
    if (right) {
      nextPart();
      return;
    }
    onMiss();
    const trap = (part.traps ?? []).find((item) =>
      item.values.every((value, fieldNo) => sameNumber(values[fieldNo] ?? '', value)),
    );
    let note: string | null = trap?.whyHtml ?? null;
    if (note === null && part.sign !== undefined) {
      const typed = parseAnswer(values[part.sign.field] ?? '');
      const want = parseAnswer(part.fields[part.sign.field]?.answer ?? '');
      if (typed !== null && want !== null && typed * want < 0) note = part.sign.whyHtml;
    }
    set({ mark: 'wrong', note });
  }

  function pickPart(optionNo: number) {
    const part = current?.parts?.[h.answered];
    if (part === undefined || part.kind !== 'choice') return;
    if (part.options[optionNo]?.right !== true) {
      set({ picked: optionNo });
      onMiss();
      return;
    }
    nextPart();
  }

  return (
    <div className="thint">
      {steps.slice(0, h.step + 1).map((item, i) => {
        if (i >= steps.length) return null;
        const done = i < h.step;
        return (
          <article key={i} className={clsx('tstep', done && 'is-done')}>
            <p className="tstep__no">
              Шаг <b>{i + 1}</b> из {steps.length}
            </p>
            <h3 className="tstep__title" dangerouslySetInnerHTML={{ __html: item.titleHtml }} />
            {item.textHtml === '' ? null : (
              <p className="tstep__text" dangerouslySetInnerHTML={{ __html: item.textHtml }} />
            )}
            {item.reminderHtml === undefined ? null : (
              <p
                className={clsx('tstep__remind', item.reminderStrong && 'tstep__remind--strong')}
                dangerouslySetInnerHTML={{ __html: item.reminderHtml }}
              />
            )}
            {item.parts === undefined ? null : (
              <Parts
                parts={item.parts}
                stepNo={i}
                current={done ? item.parts.length : h.answered}
                picked={done ? null : h.picked}
                mark={done ? null : h.mark}
                note={h.note}
                value={partValue}
                onChange={(stepNo, partNo, fieldNo, next) =>
                  set({
                    fields: { ...h.fields, [`${stepNo}:${partNo}:${fieldNo}`]: next },
                    ...(h.mark === 'wrong' ? { mark: null, note: null } : {}),
                  })
                }
                onPick={pickPart}
                onCheck={checkPart}
              />
            )}
            {item.questions === undefined ? null : (
              <Questions
                questions={item.questions}
                answered={done ? item.questions.length : h.answered}
                picked={done ? null : h.picked}
                onPick={pickOption}
              />
            )}
            {item.questions !== undefined || item.parts !== undefined ? null : (
              <div
                className={clsx(
                  'tstep__row',
                  item.shape === 'equation' && 'tstep__row--eq',
                  item.fields.length > 2 && 'tstep__row--wide',
                )}
              >
                {item.fields.map((field, fieldNo) => (
                  <Fragment key={fieldNo}>
                    {field.labelHtml === '' ? null : (
                      <span
                        className="tstep__label"
                        dangerouslySetInnerHTML={{ __html: field.labelHtml }}
                      />
                    )}
                    <Input
                      className="tstep__input"
                      value={fieldValue(i, fieldNo)}
                      state={done ? 'success' : h.mark === 'wrong' ? 'error' : 'default'}
                      inputMode="text"
                      autoComplete="off"
                      readOnly={done}
                      onChange={(event) =>
                        set({
                          fields: { ...h.fields, [`${i}:${fieldNo}`]: event.target.value },
                          ...(h.mark === 'wrong' ? { mark: null } : {}),
                        })
                      }
                    />
                  </Fragment>
                ))}
                {done ? (
                  <span className="tstep__ok" aria-label="шаг пройден">
                    <RightIcon />
                  </span>
                ) : (
                  <Button
                    onClick={checkStep}
                    disabled={item.fields.some(
                      (_, fieldNo) => fieldValue(i, fieldNo).trim() === '',
                    )}
                  >
                    Проверить
                  </Button>
                )}
              </div>
            )}
            {done || h.mark !== 'wrong' || item.parts !== undefined ? null : (
              <p className="tstep__note" dangerouslySetInnerHTML={{ __html: item.wrongHint }} />
            )}
            {done && item.afterHtml !== undefined ? (
              <p className="tstep__after" dangerouslySetInnerHTML={{ __html: item.afterHtml }} />
            ) : null}
          </article>
        );
      })}
    </div>
  );
}

/* Вопросы шага по очереди: пройденные — с отмеченным верным вариантом
   и выводом, текущий — кнопками. */
function Questions({
  questions,
  answered,
  picked,
  onPick,
}: {
  questions: TrainerQuestion[];
  answered: number;
  picked: number | null;
  onPick: (optionNo: number) => void;
}) {
  return (
    <>
      {questions.slice(0, answered + 1).map((question, questionNo) => {
        const passed = questionNo < answered;
        const wrong = !passed && picked !== null ? (question.options[picked] ?? null) : null;
        return (
          <div key={questionNo} className="tquest">
            <p
              className="tquest__prompt"
              dangerouslySetInnerHTML={{ __html: question.promptHtml }}
            />
            <div className="tquest__options" role="group">
              {question.options.map((option, optionNo) => (
                <button
                  key={optionNo}
                  type="button"
                  className={clsx(
                    'tquest__option',
                    passed && option.right && 'is-right',
                    !passed && picked === optionNo && 'is-wrong',
                  )}
                  disabled={passed}
                  aria-pressed={passed ? option.right : picked === optionNo}
                  onClick={() => onPick(optionNo)}
                  dangerouslySetInnerHTML={{ __html: option.html }}
                />
              ))}
            </div>
            {wrong === null ? null : (
              <p
                className="tstep__note"
                role="status"
                dangerouslySetInnerHTML={{ __html: wrong.whyHtml }}
              />
            )}
            {passed ? (
              <p
                className="tquest__right"
                dangerouslySetInnerHTML={{ __html: question.rightHtml }}
              />
            ) : null}
          </div>
        );
      })}
    </>
  );
}

/* Шаг из частей по очереди (парабола): кнопки или поля. */
function Parts({
  parts,
  stepNo,
  current,
  picked,
  mark,
  note,
  value,
  onChange,
  onPick,
  onCheck,
}: {
  parts: TrainerPart[];
  stepNo: number;
  current: number;
  picked: number | null;
  mark: 'right' | 'wrong' | null;
  note: string | null;
  value: (stepNo: number, partNo: number, fieldNo: number) => string;
  onChange: (stepNo: number, partNo: number, fieldNo: number, next: string) => void;
  onPick: (optionNo: number) => void;
  onCheck: () => void;
}) {
  return (
    <>
      {parts.slice(0, current + 1).map((part, partNo) => {
        const passed = partNo < current;
        if (part.kind === 'choice') {
          const wrong = !passed && picked !== null ? (part.options[picked] ?? null) : null;
          return (
            <div key={partNo} className="tquest">
              <p className="tquest__prompt" dangerouslySetInnerHTML={{ __html: part.promptHtml }} />
              <div className="tquest__options" role="group">
                {part.options.map((option, optionNo) => (
                  <button
                    key={optionNo}
                    type="button"
                    className={clsx(
                      'tquest__option',
                      passed && option.right && 'is-right',
                      !passed && picked === optionNo && 'is-wrong',
                    )}
                    disabled={passed}
                    aria-pressed={passed ? option.right : picked === optionNo}
                    onClick={() => onPick(optionNo)}
                    dangerouslySetInnerHTML={{ __html: option.html }}
                  />
                ))}
              </div>
              {wrong === null ? null : (
                <p
                  className="tstep__note"
                  role="status"
                  dangerouslySetInnerHTML={{ __html: wrong.whyHtml }}
                />
              )}
              {passed ? (
                <p className="tquest__right" dangerouslySetInnerHTML={{ __html: part.rightHtml }} />
              ) : null}
            </div>
          );
        }
        const empty = part.fields.some(
          (_, fieldNo) => value(stepNo, partNo, fieldNo).trim() === '',
        );
        return (
          <div key={partNo} className="tquest">
            {part.textHtml === '' ? null : (
              <p className="tquest__prompt" dangerouslySetInnerHTML={{ __html: part.textHtml }} />
            )}
            <div className={clsx('tstep__row', part.fields.length > 2 && 'tstep__row--wide')}>
              {part.fields.map((field, fieldNo) => (
                <Fragment key={fieldNo}>
                  <span
                    className="tstep__label"
                    dangerouslySetInnerHTML={{ __html: field.labelHtml }}
                  />
                  <Input
                    className="tstep__input"
                    value={value(stepNo, partNo, fieldNo)}
                    state={passed ? 'success' : mark === 'wrong' ? 'error' : 'default'}
                    inputMode="text"
                    autoComplete="off"
                    readOnly={passed}
                    onChange={(event) => onChange(stepNo, partNo, fieldNo, event.target.value)}
                  />
                </Fragment>
              ))}
              {passed ? (
                <span className="tstep__ok" aria-label="часть пройдена">
                  <RightIcon />
                </span>
              ) : (
                <Button onClick={onCheck} disabled={empty}>
                  Проверить
                </Button>
              )}
            </div>
            {!passed && mark === 'wrong' ? (
              <p
                className="tstep__note"
                role="status"
                dangerouslySetInnerHTML={{ __html: note ?? part.wrongHint }}
              />
            ) : null}
            {passed && part.afterHtml !== undefined ? (
              <p className="tstep__after" dangerouslySetInnerHTML={{ __html: part.afterHtml }} />
            ) : null}
          </div>
        );
      })}
    </>
  );
}

/** Разбор: верный ответ и тот же разбор, что в опорных задачах, с рисунком метода. */
function Razbor12({ task }: { task: TrainerTask }) {
  return (
    <div className="tsolution">
      <TrainerReview task={task} />
      {task.method === null ? null : (
        <aside className="tmethod">
          <p className="tmethod__label">Каким методом решали</p>
          <div className="tmethod__body">
            <span
              className="tmethod__chart"
              aria-hidden="true"
              dangerouslySetInnerHTML={{ __html: task.method.svg }}
            />
            <div className="tmethod__text">
              <p
                className="tmethod__title"
                dangerouslySetInnerHTML={{ __html: task.method.title }}
              />
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}

/** Карточка №12 для общего тренажёра. */
export const KARTOCHKA_12: KartochkaRazdela<TrainerTask> = {
  zagruzit: async () => {
    /* Движок graph/ и KaTeX весят сотни килобайт: только по «Начать». */
    const [{ zadachaShablona }, { seedZadaniya }] = await Promise.all([
      import('@/lib/trainerSession'),
      import('@/lib/trenazher/sessiya'),
    ]);
    const cache = new Map();
    return {
      postroit: (payload, at, pohozhaya) => {
        const item = payload.items[at];
        return item === undefined
          ? null
          : zadachaShablona(item.k, seedZadaniya(payload, at, pohozhaya), cache);
      },
    };
  },
  html: (task) => task.questionHtml,
  Uslovie: Uslovie12,
  Otvet: Otvet12,
  /* У задачи с выбором ответ — номер варианта: «02» и «2» — разные. */
  proverit: (task, value) =>
    task.options === null ? sameNumber(value, task.answer) : value === task.answer,
  poyasnenie: (task, value, right) =>
    right
      ? task.options === null
        ? task.rightHint
        : ''
      : task.options === null
        ? task.wrongHint
        : (task.oshibki[value] ?? ''),
  estPodskazka: (task) => task.steps.length > 0,
  Podskazka: Podskazka12,
  /* Верный ответ показать можно всегда, разбор — где его строит движок. */
  estRazbor: () => true,
  Razbor: Razbor12,
  zapisat: (key, itog) =>
    recordAttempt({
      kind: key.split('-')[0] ?? key,
      taskId: key,
      right: itog.right,
      clean: itog.clean,
      seconds: itog.sek,
    }),
};
