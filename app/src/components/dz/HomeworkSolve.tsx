'use client';

/**
 * Ученик решает ДЗ: задачи можно переключать в любом порядке, ответ
 * проверяет база (попытки считает она же), решения — по настройке
 * репетитора. Ход решения хранится в базе сразу после каждой проверки,
 * набранный, но не проверенный ответ — в браузере: незаконченное ДЗ
 * открывается с того же места.
 */

import Link from 'next/link';
import { clsx } from 'clsx';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Card, FieldMessage } from '@/components/ui';
import { AnswerInput, FormatHint } from '@/components/tasks/otvet/AnswerInput';
import { Razbor8 } from '@/components/tasks/vychisleniya/Razbor8';
import type { Names8 } from '@/components/tasks/vychisleniya/Progress8';
import { DZ, dueRu, dzError } from '@/content/dz';
import type { HwFull } from '@/lib/dz/api';
import { DZ_HREF } from '@/lib/dz/links';
import { tasksOf } from '@/lib/dz/results';
import { sanitizeHtml } from '@/lib/dz/sanitize';
import type { HwAnswerView, HwState, HwTaskView } from '@/lib/dz/types';
import type { Built8 } from '@/lib/dz/z08';
import { displayAnswer, formatHint, fractionRightHint, normalizeAnswer } from '@/lib/otvet';
import { browserStorage } from '@/lib/storage';
import { taskId } from '@/lib/vychisleniya/ids';
import type { RazborHtml } from '@/lib/vychisleniya/razbor';
import { skillOfPrototype } from '@/lib/vychisleniya/skills';
import { Confirm, dzApi, errorCode } from './common';

const t = DZ.solve;

/** Вёрстка решения из базы — только после очистки. */
export function cleanRazbor(razbor: RazborHtml): RazborHtml {
  return {
    shagi: razbor.shagi.map((s) => ({ chto: sanitizeHtml(s.chto), tex: sanitizeHtml(s.tex) })),
    delimost: razbor.delimost.map((d) => ({ ...d, html: sanitizeHtml(d.html) })),
  };
}

const DRAFT = 'budetege-dz:otvet:';

function readDraft(task: string): string {
  try {
    return browserStorage()?.getItem(DRAFT + task) ?? '';
  } catch {
    return '';
  }
}

function writeDraft(task: string, value: string): void {
  try {
    if (value === '') browserStorage()?.removeItem(DRAFT + task);
    else browserStorage()?.setItem(DRAFT + task, value);
  } catch {
    /* Черновик не сохранился — ответ в поле остаётся до перезагрузки. */
  }
}

/** Что сказать после проверки: подсказка о записи или ничего (вердикт — по состоянию). */
type CheckOutcome = { hint: string | null; wrong: boolean };

export function HomeworkSolve({
  full,
  names,
  memo,
  userId,
  reload,
}: {
  full: HwFull;
  names: Names8;
  memo: Readonly<Record<string, string>>;
  userId: string;
  reload: () => Promise<void>;
}) {
  const hw = full.hw;
  const tasks = useMemo(() => tasksOf(full.tasks, userId), [full.tasks, userId]);
  const mine = full.recipients.find((r) => r.userId === userId) ?? full.recipients[0];
  const [answers, setAnswers] = useState<Map<string, HwAnswerView>>(
    () => new Map(full.answers.filter((a) => a.userId === userId).map((a) => [a.taskId, a])),
  );
  const stateOf = useCallback((id: string): HwState => answers.get(id)?.state ?? 'open', [answers]);
  const [index, setIndex] = useState(() => {
    const open = tasks.findIndex((task) => (answers.get(task.id)?.state ?? 'open') === 'open');
    return open === -1 ? 0 : open;
  });
  const task = tasks[index];
  const [solutions, setSolutions] = useState<Map<string, RazborHtml | null>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [ask, setAsk] = useState<'reveal' | 'submit' | null>(null);

  const submittedAt = mine?.submittedAt ?? null;
  const readOnly = submittedAt !== null || hw.closedAt !== null;
  const late = !readOnly && hw.dueAt !== null && Date.parse(hw.dueAt) < full.loadedAt;

  /* Первое открытие — «начато» в базе. */
  useEffect(() => {
    if (mine !== undefined && mine.startedAt === null && !readOnly) {
      void dzApi().then((api) => api.startHomework(hw.id).catch(() => undefined));
    }
  }, [hw.id, mine, readOnly]);

  /* Решение закрытой задачи или после сдачи — если база его уже отдаёт. */
  useEffect(() => {
    if (task === undefined || solutions.has(task.id)) return;
    if (stateOf(task.id) === 'open' && submittedAt === null) return;
    let alive = true;
    void (async () => {
      const solution = await (await dzApi()).loadSolution(task.id).catch(() => null);
      if (alive) setSolutions((m) => new Map(m).set(task.id, solution?.razbor ?? null));
    })();
    return () => {
      alive = false;
    };
  }, [task, solutions, stateOf, submittedAt]);

  if (task === undefined) {
    return <p className="auth-form__muted">{t.notFound}</p>;
  }

  const state = stateOf(task.id);
  const answer = answers.get(task.id);
  const left =
    hw.attemptsLimit === null ? null : Math.max(0, hw.attemptsLimit - (answer?.attempts ?? 0));
  const canAnswer = !readOnly && state === 'open';
  const right = tasks.filter((x) => stateOf(x.id) === 'right').length;
  const openCount = tasks.filter((x) => stateOf(x.id) === 'open').length;
  const solution = solutions.get(task.id);
  const skill = skillOfPrototype(task.kind)?.id ?? '';

  /** Отправить ответ в базу. Неверную запись поле ловит само, до базы. */
  async function check(current: HwTaskView, value: string, seconds: number): Promise<CheckOutcome> {
    setError(null);
    const read = normalizeAnswer(value);
    if (!read.ok) {
      if (read.problem === 'empty') return { hint: null, wrong: false };
      /* Неверная запись — подсказка сразу, попытка не тратится. Дробь
         проверяет база: верное значение — тоже только подсказка. */
      if (read.problem !== 'fraction')
        return { hint: formatHint(read.problem, read.meant), wrong: false };
    }
    try {
      const result = await (await dzApi()).checkAnswer(current.id, value, seconds); // как ввёл ученик: база приводит запись сама
      if (result.kind === 'format') return { hint: formatHint('other', null), wrong: false };
      if (result.kind === 'fractionRight')
        return { hint: fractionRightHint(result.decimal), wrong: false };
      if (result.kind === 'closed') {
        await reload();
        return { hint: null, wrong: false };
      }
      const ok = result.kind === 'right';
      setAnswers((m) =>
        new Map(m).set(current.id, {
          taskId: current.id,
          userId,
          state: result.state,
          attempts: result.attempts,
          seconds: (m.get(current.id)?.seconds ?? 0) + Math.round(seconds),
          entries: [
            ...(m.get(current.id)?.entries ?? []),
            { a: value, n: read.ok ? read.value : null, ok, at: new Date().toISOString() },
          ],
        }),
      );
      if (result.solution !== null) {
        setSolutions((m) => new Map(m).set(current.id, result.solution));
      }
      if (ok) writeDraft(current.id, '');
      return { hint: null, wrong: !ok };
    } catch (e) {
      setError(dzError(errorCode(e)));
    }
    return { hint: null, wrong: false };
  }

  async function reveal() {
    if (task === undefined) return;
    const current = task;
    setAsk(null);
    try {
      const razbor = await (await dzApi()).revealSolution(current.id);
      setAnswers((m) =>
        new Map(m).set(current.id, {
          taskId: current.id,
          userId,
          state: 'revealed',
          attempts: m.get(current.id)?.attempts ?? 0,
          seconds: m.get(current.id)?.seconds ?? 0,
          entries: m.get(current.id)?.entries ?? [],
        }),
      );
      setSolutions((m) => new Map(m).set(current.id, razbor));
    } catch (e) {
      setError(dzError(errorCode(e)));
    }
  }

  async function submit() {
    setAsk(null);
    try {
      await (await dzApi()).submitHomework(hw.id);
      setSolutions(new Map());
      await reload();
    } catch (e) {
      setError(dzError(errorCode(e)));
    }
  }

  return (
    <div className="dz-page dz-solve" data-page="domashka-uchenik">
      <Link className="dz-back" href={DZ_HREF.kabinet}>
        {t.back}
      </Link>
      <header className="dz-head">
        <h1 className="dz-head__title">{hw.title}</h1>
        {hw.dueAt === null ? null : <p className="dz-head__due">{t.due(dueRu(hw.dueAt))}</p>}
      </header>
      {hw.note === '' ? null : (
        <aside className="dz-note" data-note="hw">
          <p className="dz-note__title">{t.tutorNote}</p>
          <p className="dz-note__text">{hw.note}</p>
        </aside>
      )}
      {submittedAt !== null ? (
        <p className="dz-banner dz-banner--ok" role="status" data-state="submitted">
          {t.submittedAt(dueRu(submittedAt))} · {t.summary(right, tasks.length)}
        </p>
      ) : hw.closedAt !== null ? (
        <p className="dz-banner" role="status">
          {t.closedByTutor}
        </p>
      ) : late ? (
        <p className="dz-banner dz-banner--warn" role="status">
          {t.late}
        </p>
      ) : null}

      <nav className="dz-strip" aria-label={t.strip}>
        {tasks.map((x, i) => {
          const s = stateOf(x.id);
          const tried = s === 'open' && (answers.get(x.id)?.attempts ?? 0) > 0;
          return (
            <button
              key={x.id}
              type="button"
              className={clsx(
                'dz-strip__btn',
                `is-${s}`,
                tried && 'is-trying',
                i === index && 'is-current',
              )}
              aria-current={i === index ? 'step' : undefined}
              aria-label={`${t.task(i + 1, tasks.length)}: ${DZ.results[stripLabel(s, tried)]}`}
              onClick={() => setIndex(i)}
            >
              {i + 1}
            </button>
          );
        })}
      </nav>

      <article className="dz-task" data-task={task.id} data-state={state}>
        <p className="dz-task__no">
          {t.task(index + 1, tasks.length)} ·{' '}
          <span dangerouslySetInnerHTML={{ __html: names[task.kind] ?? task.kind }} />
        </p>
        <div
          className="dz-task__q"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(task.questionHtml) }}
        />
        {task.comment === null ? null : (
          <aside className="dz-note dz-note--task" data-note="task">
            <p className="dz-note__title">{t.taskNote}</p>
            <p className="dz-note__text">{task.comment}</p>
          </aside>
        )}
      </article>

      {hw.showMemo && memo[skill] !== undefined ? (
        <aside className="dz-memo" data-block="memo">
          <p className="dz-memo__title">{t.memo}</p>
          <span dangerouslySetInnerHTML={{ __html: memo[skill]! }} />
        </aside>
      ) : null}
      {hw.showExample ? <Example key={task.kind} kind={task.kind} /> : null}

      <AnswerBox
        key={task.id}
        task={task}
        state={state}
        last={answer?.entries[answer.entries.length - 1]?.a ?? ''}
        canAnswer={canAnswer}
        left={left}
        instant={hw.solutionsWhen === 'instant'}
        hasNext={index < tasks.length - 1}
        onCheck={check}
        onReveal={() => setAsk('reveal')}
        onNext={() => setIndex(index + 1)}
      />

      {(answer?.entries.length ?? 0) > 0 ? (
        <p className="dz-entries">
          {t.yourAnswers}:{' '}
          {answer!.entries.map((e, i) => (
            <span key={i} className={clsx('dz-entry', e.ok ? 'is-right' : 'is-wrong')}>
              {e.n === null ? e.a : displayAnswer(e.n)}
            </span>
          ))}
        </p>
      ) : null}

      {solution !== undefined && solution !== null ? (
        <Razbor8 razbor={cleanRazbor(solution)} />
      ) : (state !== 'open' || submittedAt !== null) &&
        solution === null &&
        hw.solutionsWhen !== 'instant' ? (
        <p className="auth-form__muted">{t.solutionLater(hw.solutionsWhen)}</p>
      ) : null}

      {error === null ? null : <FieldMessage tone="error">{error}</FieldMessage>}

      {readOnly ? null : (
        <div className="dz-submit">
          <p className="auth-form__muted">{t.saved}</p>
          <Button variant="secondary" onClick={() => setAsk('submit')}>
            {t.submit}
          </Button>
        </div>
      )}

      <Confirm
        open={ask === 'reveal'}
        title={t.reveal}
        text={t.revealConfirm}
        action={t.reveal}
        onCancel={() => setAsk(null)}
        onConfirm={() => void reveal()}
      />
      <Confirm
        open={ask === 'submit'}
        title={t.submit}
        text={t.submitConfirm(openCount)}
        action={t.submit}
        onCancel={() => setAsk(null)}
        onConfirm={() => void submit()}
      />
    </div>
  );
}

/**
 * Поле ответа одной задачи. Ключ — id задачи: при переключении поле
 * заводится заново со своим черновиком и своим отсчётом времени.
 */
function AnswerBox({
  task,
  state,
  last,
  canAnswer,
  left,
  instant,
  hasNext,
  onCheck,
  onReveal,
  onNext,
}: {
  task: HwTaskView;
  state: HwState;
  /** Последний проверенный ответ: у закрытой задачи он и стоит в поле. */
  last: string;
  canAnswer: boolean;
  left: number | null;
  instant: boolean;
  hasNext: boolean;
  onCheck: (task: HwTaskView, value: string, seconds: number) => Promise<CheckOutcome>;
  onReveal: () => void;
  onNext: () => void;
}) {
  const [value, setValue] = useState(() => (state === 'open' ? readDraft(task.id) : last));
  const [hint, setHint] = useState<string | null>(null);
  const [wrong, setWrong] = useState(false);
  const [busy, setBusy] = useState(false);
  /* Сколько ученик смотрел на задачу: отсчёт с показа и с прошлой проверки. */
  const shownAt = useRef(0);
  useEffect(() => {
    shownAt.current = Date.now();
  }, []);

  async function submit() {
    if (!canAnswer || busy) return;
    setBusy(true);
    setHint(null);
    const seconds = (Date.now() - shownAt.current) / 1000;
    shownAt.current = Date.now();
    const outcome = await onCheck(task, value, seconds);
    setHint(outcome.hint);
    setWrong(outcome.wrong);
    setBusy(false);
  }

  return (
    <>
      <form
        className="dz-answer"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <p className="dz-answer__label" id="dz-answer-label">
          {t.answer}
        </p>
        <AnswerInput
          value={value}
          state={state === 'right' ? 'success' : state === 'open' ? 'default' : 'error'}
          aria-labelledby="dz-answer-label"
          readOnly={!canAnswer}
          onChange={(next) => {
            setValue(next);
            writeDraft(task.id, next);
            setHint(null);
            setWrong(false);
          }}
        />
        {hint === null ? null : <FormatHint text={hint} />}
        <div className="dz-actions">
          {canAnswer ? (
            <Button type="submit" disabled={busy || value.trim() === ''}>
              {t.check}
            </Button>
          ) : null}
          {canAnswer && instant ? (
            <Button variant="ghost" onClick={onReveal}>
              {t.reveal}
            </Button>
          ) : null}
          {hasNext ? (
            <Button variant="ghost" onClick={onNext}>
              {t.next}
            </Button>
          ) : null}
        </div>
        {canAnswer ? (
          <p className="auth-form__muted" data-left={left ?? 'inf'}>
            {left === null ? t.unlimited : t.left(left)}
          </p>
        ) : null}
      </form>
      {wrong && state === 'open' ? (
        <p className="dz-verdict dz-verdict--wrong" role="status">
          {t.wrong}
        </p>
      ) : (
        <Verdict state={state} />
      )}
    </>
  );
}

/** Вердикт по состоянию задачи в базе. */
function Verdict({ state }: { state: HwState }) {
  if (state === 'open') return null;
  return (
    <p
      className={clsx('dz-verdict', state === 'right' ? 'dz-verdict--right' : 'dz-verdict--wrong')}
      role="status"
    >
      {state === 'right' ? t.right : state === 'revealed' ? t.revealed : t.wrongClosed}
    </p>
  );
}

function stripLabel(
  state: HwState,
  tried: boolean,
): 'legendRight' | 'legendWrong' | 'legendRevealed' | 'legendTrying' | 'legendNone' {
  if (state === 'right') return 'legendRight';
  if (state === 'wrong') return 'legendWrong';
  if (state === 'revealed') return 'legendRevealed';
  return tried ? 'legendTrying' : 'legendNone';
}

/**
 * Разобранный пример того же типа: своя задача на постоянном seed — та
 * же у всех учеников, к ДЗ не относится и ответа задач ДЗ не раскрывает.
 */
function Example({ kind }: { kind: string }) {
  const [built, setBuilt] = useState<Built8 | null>(null);
  useEffect(() => {
    let alive = true;
    void import('@/lib/dz/z08').then(({ build8 }) => {
      if (alive) setBuilt(build8(taskId(kind, `primer-${kind}`, null)));
    });
    return () => {
      alive = false;
    };
  }, [kind]);
  if (built === null) return null;
  return (
    <details className="dz-example" data-block="example">
      <summary>{t.example}</summary>
      <Card compact>
        <div dangerouslySetInnerHTML={{ __html: built.questionHtml }} />
        {/* Ответ — в последнем шаге решения, набранном KaTeX. */}
        <Razbor8 razbor={built.razbor} title={null} />
      </Card>
    </details>
  );
}
