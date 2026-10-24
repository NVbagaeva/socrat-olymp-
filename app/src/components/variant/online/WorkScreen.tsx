'use client';

import { clsx } from 'clsx';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Button, FigureZoom, Modal } from '@/components/ui';
import { HintFlow } from '@/components/tasks/card/HintFlow';
import { useBeforeFinish } from '@/components/tasks/session/useBeforeFinish';
import { useSessionReport } from '@/components/tasks/session/useSessionReport';
import { ONLINE_TEXT as T } from '@/content/variantOnline/text';
import { katex } from '@/lib/graph/katex';
import { upgrade } from '@/lib/graph/katex-upgrade.js';
import { normalizeAnswer } from '@/lib/variant/online/normalize';
import type { Proverka } from '@/lib/variant/online/proverka';
import type { Check, WorkPayload, WorkUi } from '@/lib/variant/online/sessionUi';
import type { VariantTask } from '@/lib/variant/types';
import { Chast2Card } from '@/components/chast2/Chast2Card';
import { CHAST2_TEXT as C2 } from '@/content/variantOnline/chast2Text';
import { AUTH_ENABLED, AUTH_HREF } from '@/lib/auth/config';
import { useSessionUser } from '@/lib/auth/session';
import { pustoyChast2, punktKey, vvodEst, type Chast2Ui } from '@/lib/chast2/sostoyanie';
import type { Chast2Zadacha } from '@/lib/povyshennye/chast2/types';
import { part2Of } from '@/lib/variant/online/sessionUi';
import { AnswerField } from './AnswerField';
import { clockText } from './format';

export interface WorkScreenProps {
  payload: WorkPayload;
  restored: WorkUi | null;
  report: (ui: WorkUi) => void;
  elapsed: () => number;
  finish: () => void;
  setBeforeFinish: (handler: (() => void) | null) => void;
  proverka: Proverka;
  /** Последнее состояние экрана перед завершением — для результатов. */
  onSnapshot: (ui: WorkUi) => void;
  /** Номера заданий без ответа — для вопроса оболочки «Завершить?». */
  onEmpty: (list: string) => void;
}

type Status = 'empty' | 'answered' | 'later' | 'right' | 'wrong' | 'scored';

/** Есть ли ответ хоть в одном пункте задания части 2. */
export function chast2Est(z: Chast2Zadacha, st: Chast2Ui): boolean {
  return z.punkty.some((p, i) => p.pole !== null && vvodEst(st.vvod[punktKey(z.no, i)] ?? null));
}

/** Шаги разбора ученика (`li.var-razbor__step`): для подсказки по шагам. */
function razborSteps(html: string | null): string[] {
  if (html === null || typeof DOMParser === 'undefined') return [];
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
  return [...doc.querySelectorAll('li.var-razbor__step')].map((li) => li.innerHTML);
}

/** Номер задания на ленте: в «Работе над ошибками» — номер ЕГЭ. */
function noOf(task: VariantTask): number {
  return task.egeNumber;
}

/**
 * Экран решения варианта: лента номеров, карточка задания, поле ответа.
 *
 * Переход между заданиями свободный, как на экзамене: лента сверху,
 * стрелки, свайп на телефоне. Тренировка проверяет ответ сразу и при
 * ошибке даёт подсказку и вторую попытку; контрольная только сохраняет
 * ответы до «Завершить работу». Всё состояние — в `report`: оболочка
 * сессии пишет его в localStorage, после перезагрузки экран встаёт как был.
 */
export function WorkScreen({
  payload,
  restored,
  report,
  elapsed,
  finish,
  setBeforeFinish,
  proverka,
  onSnapshot,
  onEmpty,
}: WorkScreenProps) {
  const tasks = payload.tasks;
  const part2 = useMemo(() => part2Of(payload), [payload]);
  /* Лента: задания части 1, за ними — 14–20. */
  const total = tasks.length + part2.length;
  const trening = payload.mode === 'trening';
  const [index, setIndex] = useState(Math.min(restored?.index ?? 0, total - 1));
  const [chast2, setChast2] = useState<Chast2Ui>(restored?.chast2 ?? pustoyChast2());
  const user = useSessionUser();
  const [answers, setAnswers] = useState<Record<number, string>>(restored?.answers ?? {});
  const [second, setSecond] = useState<Record<number, string>>(restored?.second ?? {});
  const [v1, setV1] = useState<Record<number, Check>>(restored?.v1 ?? {});
  const [v2, setV2] = useState<Record<number, Check>>(restored?.v2 ?? {});
  const [later, setLater] = useState<number[]>(restored?.later ?? []);
  const [hinted, setHinted] = useState<number[]>(restored?.hinted ?? []);
  const [steps, setSteps] = useState<Record<number, number>>(restored?.steps ?? {});
  const [startedAt] = useState(() => restored?.startedAt ?? Date.now());
  const [razborOpen, setRazborOpen] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [checking, setChecking] = useState(false);
  const [times, setTimes] = useState<Record<number, number>>(restored?.times ?? {});
  const enterRef = useRef({ index, at: elapsed() });
  const card = useRef<HTMLDivElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);

  const task = tasks[index] ?? tasks[0];
  const z2 = index >= tasks.length ? (part2[index - tasks.length] ?? null) : null;

  /* ── Время на задание ─────────────────────────────────────────── */
  /** Активное время с прихода на задание — в его счётчик. */
  const takeDelta = useCallback((): { at: number; ms: number } => {
    const now = elapsed();
    const { index: at, at: since } = enterRef.current;
    enterRef.current = { index: at, at: now };
    return { at, ms: Math.max(0, now - since) };
  }, [elapsed]);
  const commitTime = useCallback(() => {
    const { at, ms } = takeDelta();
    if (ms > 0) setTimes((t) => ({ ...t, [at]: (t[at] ?? 0) + ms }));
  }, [takeDelta]);

  useEffect(() => {
    const beat = window.setInterval(commitTime, 10_000);
    return () => window.clearInterval(beat);
  }, [commitTime]);

  /* ── Статусы ──────────────────────────────────────────────────── */
  const statusOf = (i: number): Status => {
    if (i >= tasks.length) {
      const z = part2[i - tasks.length];
      if (z === undefined) return 'empty';
      if (chast2.ball[z.no] !== undefined) return 'scored';
      if (later.includes(i)) return 'later';
      return chast2Est(z, chast2) ? 'answered' : 'empty';
    }
    if (trening && v1[i] !== undefined) return v1[i];
    if (later.includes(i)) return 'later';
    return filled(i) ? 'answered' : 'empty';
  };
  /* Ответ засчитывается, только если записан по правилам ЕГЭ. */
  const filled = (i: number) => normalizeAnswer(answers[i] ?? '').ok;
  const emptyList = [
    ...tasks.map((t, i) => (filled(i) ? null : `№${noOf(t)}`)),
    ...part2.map((z) => (chast2Est(z, chast2) ? null : `№${z.no}`)),
  ].filter((x): x is string => x !== null);

  const ui: WorkUi = {
    index,
    marks: Object.fromEntries(
      Object.entries(v1)
        .filter(([, v]) => v === 'right')
        .map(([k]) => [Number(k), 'right' as const]),
    ),
    tried: Object.fromEntries(
      Object.entries(v1)
        .filter(([, v]) => v === 'wrong')
        .map(([k]) => [Number(k), true as const]),
    ),
    order: null,
    answers,
    second,
    v1,
    v2,
    later,
    hinted,
    steps,
    times,
    startedAt,
    chast2,
  };
  useSessionReport(report, ui);
  useBeforeFinish(setBeforeFinish, () => {
    const { at, ms } = takeDelta();
    const last = { ...ui, times: { ...times, [at]: (times[at] ?? 0) + ms } };
    report(last);
    onSnapshot(last);
  });
  useEffect(() => {
    onEmpty(emptyList.length === 0 ? '' : emptyList.join(', '));
  });

  /* Формулы-заглушки (.math) набираются KaTeX после отрисовки. */
  useEffect(() => {
    if (card.current !== null) upgrade(card.current, katex);
  });

  /* ── Таймер ───────────────────────────────────────────────────── */
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (payload.timer.kind === 'none') return undefined;
    const t = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(t);
  }, [payload.timer.kind]);
  /* Тренировка — активное время (пауза останавливает), контрольная —
     время по часам: идёт, даже если закрыть вкладку. */
  const spent = trening ? elapsed() : Math.max(0, now - startedAt);
  const limit = payload.timer.kind === 'down' ? payload.timer.minutes * 60_000 : null;
  const left = limit === null ? null : limit - spent;
  const finishedRef = useRef(false);
  useEffect(() => {
    if (left !== null && left <= 0 && !finishedRef.current) {
      finishedRef.current = true;
      finish();
    }
  }, [left, finish]);

  /* ── Действия ─────────────────────────────────────────────────── */
  function go(to: number) {
    if (to < 0 || to >= total || to === index) return;
    commitTime();
    enterRef.current = { index: to, at: elapsed() };
    setIndex(to);
    setRazborOpen(false);
    setProblem(null);
  }

  const phase: 'first' | 'second' | 'done' = !trening
    ? 'first'
    : v1[index] === undefined
      ? 'first'
      : v1[index] === 'wrong' && v2[index] === undefined
        ? 'second'
        : 'done';
  const value = phase === 'second' ? (second[index] ?? '') : (answers[index] ?? '');

  function setValue(next: string) {
    setProblem(null);
    if (phase === 'second') setSecond((s) => ({ ...s, [index]: next }));
    else if (phase === 'first') setAnswers((a) => ({ ...a, [index]: next }));
  }

  async function check() {
    if (task === undefined || checking) return;
    setChecking(true);
    try {
      const verdict = await proverka.checkOne(index, value);
      if (verdict.kind === 'format') {
        setProblem(T.format[verdict.problem]);
        return;
      }
      const res: Check = verdict.kind === 'right' ? 'right' : 'wrong';
      if (phase === 'first') setV1((v) => ({ ...v, [index]: res }));
      else setV2((v) => ({ ...v, [index]: res }));
      setLater((l) => l.filter((x) => x !== index));
      if (phase === 'second') setRazborOpen(true);
    } finally {
      setChecking(false);
    }
  }

  const markHinted = () => {
    if (!hinted.includes(index)) setHinted((h) => [...h, index]);
  };

  const stepList = useMemo(() => razborSteps(task?.solutionStudent ?? null), [task]);

  if (task === undefined) return null;
  const status = statusOf(index);
  const hasHints = (task.hints?.length ?? 0) > 0;
  const shownSteps = steps[index] ?? 0;
  const checkedRight = v1[index] === 'right' || v2[index] === 'right';

  let feedback: ReactNode = null;
  if (trening && v1[index] !== undefined) {
    feedback = (
      <div className="vo-feedback" aria-live="polite">
        {v1[index] === 'right' ? (
          <p className="vo-verdict is-right">{T.run.right}</p>
        ) : (
          <>
            <p className="vo-verdict is-wrong">
              {T.run.wrong}{' '}
              {phase === 'second' ? (hasHints ? T.run.wrongHints : T.run.wrongSteps) : null}
            </p>
            {phase === 'second' ? (
              hasHints ? (
                <div onClickCapture={markHinted}>
                  <HintFlow shagi={task.hints ?? []} />
                </div>
              ) : stepList.length > 0 ? (
                <div className="vo-steps">
                  <ol className="var-razbor">
                    {stepList.slice(0, shownSteps).map((s, i) => (
                      <li
                        key={i}
                        className="var-razbor__step"
                        dangerouslySetInnerHTML={{ __html: s }}
                      />
                    ))}
                  </ol>
                  {shownSteps < stepList.length ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        markHinted();
                        setSteps((s) => ({ ...s, [index]: shownSteps + 1 }));
                      }}
                    >
                      {T.run.showStep}
                    </Button>
                  ) : null}
                </div>
              ) : null
            ) : v2[index] === 'right' ? (
              <p className="vo-verdict is-right">{T.run.secondRight}</p>
            ) : (
              <p className="vo-verdict is-wrong">{T.run.secondWrong}</p>
            )}
          </>
        )}
        {phase === 'done' ? (
          <div className="vo-razbor">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRazborOpen((o) => !o)}
              aria-expanded={razborOpen}
            >
              {razborOpen ? T.run.hideRazbor : T.run.razbor}
            </Button>
            {razborOpen ? (
              task.solutionStudent === null ? (
                <p className="vo-note">{T.run.noRazbor}</p>
              ) : (
                <div
                  className="vo-razbor__body"
                  dangerouslySetInnerHTML={{ __html: task.solutionStudent }}
                />
              )
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="vo" ref={card}>
      {payload.timer.kind === 'none' || (trening && payload.timer.kind === 'up') ? null : (
        <div
          className={clsx('vo-timer', left !== null && left <= 60_000 && 'is-low')}
          role="timer"
          aria-live="off"
        >
          {left !== null
            ? left > 0
              ? T.run.left(clockText(left))
              : T.run.over
            : T.run.clock(clockText(spent))}
        </div>
      )}
      {trening ? null : <p className="vo-note vo-note--top">{T.run.kontrolNote}</p>}

      <nav className="vo-strip" aria-label={T.run.nav}>
        <ol>
          {tasks.map((t, i) => {
            const st = statusOf(i);
            return (
              <li key={`${t.taskId}-${i}`}>
                <button
                  type="button"
                  className={clsx('vo-strip__no', `is-${st}`, i === index && 'is-current')}
                  aria-current={i === index ? 'step' : undefined}
                  aria-label={`${T.run.task(noOf(t))}: ${T.run.status[st]}`}
                  data-status={st}
                  onClick={() => go(i)}
                >
                  {noOf(t)}
                  {st === 'later' ? <span className="vo-strip__flag" aria-hidden="true" /> : null}
                </button>
              </li>
            );
          })}
          {part2.map((z, j) => {
            const i = tasks.length + j;
            const st = statusOf(i);
            return (
              <li key={`p2-${z.no}`} className={j === 0 ? 'vo-strip__part2' : undefined}>
                <button
                  type="button"
                  className={clsx(
                    'vo-strip__no',
                    'is-part2',
                    `is-${st}`,
                    i === index && 'is-current',
                  )}
                  aria-current={i === index ? 'step' : undefined}
                  aria-label={`${T.run.task(z.no)}: ${T.run.status[st]}`}
                  data-status={st}
                  onClick={() => go(i)}
                >
                  {z.no}
                  {st === 'later' ? <span className="vo-strip__flag" aria-hidden="true" /> : null}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <article
        className="vo-card"
        data-testid="vo-card"
        onTouchStart={(e) => {
          const p = e.touches[0];
          touch.current =
            e.touches.length === 1 && p !== undefined ? { x: p.clientX, y: p.clientY } : null;
        }}
        onTouchEnd={(e) => {
          const s = touch.current;
          const p = e.changedTouches[0];
          touch.current = null;
          if (s === null || p === undefined) return;
          const dx = p.clientX - s.x;
          const dy = p.clientY - s.y;
          if (Math.abs(dx) > 70 && Math.abs(dy) < 50) go(index + (dx < 0 ? 1 : -1));
        }}
      >
        <header className="vo-card__head">
          <h2 className="vo-card__title">
            {z2 === null ? T.run.task(noOf(task)) : T.run.task(z2.no)}
            {z2 === null ? null : <span className="vo-tag">{C2.partTitle}</span>}
            {payload.oshibki !== null ? (
              <span className="vo-tag">
                {payload.oshibki.analog[index] === true ? 'Аналог' : 'Из варианта'}
              </span>
            ) : null}
          </h2>
          <span className={clsx('vo-status', `is-${status}`)}>{T.run.status[status]}</span>
        </header>
        {z2 === null ? (
          <>
            <div
              className="vo-card__statement"
              dangerouslySetInnerHTML={{ __html: task.statement }}
            />
            {task.figure === null ? null : (
              <FigureZoom label={T.run.figure(noOf(task))} className="vo-card__figure" pinch>
                <span dangerouslySetInnerHTML={{ __html: task.figure.svg }} />
              </FigureZoom>
            )}

            <AnswerField
              key={`${index}-${phase}`}
              value={value}
              onChange={setValue}
              problem={problem}
              readOnly={phase === 'done'}
              state={phase === 'done' ? (checkedRight ? 'success' : 'error') : 'default'}
              action={
                trening
                  ? phase === 'done'
                    ? null
                    : {
                        label: phase === 'second' ? T.run.checkAgain : T.run.check,
                        onClick: () => void check(),
                        busy: checking,
                      }
                  : null
              }
              onFormat={(p) => setProblem(p === null ? null : T.format[p])}
              saved={!trening && filled(index)}
            />

            {feedback}
          </>
        ) : (
          <>
            {trening ? null : <p className="vo-note">{C2.samoKontrol}</p>}
            {user === null ? (
              <p className="c2-banner" data-testid="c2-login">
                {C2.loginBanner}
                {AUTH_ENABLED ? (
                  <>
                    {'. '}
                    <a href={AUTH_HREF.voyti}>{C2.loginLink}</a>
                  </>
                ) : null}
              </p>
            ) : null}
            <Chast2Card
              key={z2.no}
              z={z2}
              st={chast2}
              update={(fn) => setChast2(fn)}
              samo={trening}
            />
          </>
        )}

        <label className="vo-later">
          <input
            type="checkbox"
            checked={later.includes(index)}
            disabled={trening && phase === 'done'}
            onChange={(e) =>
              setLater((l) => (e.target.checked ? [...l, index] : l.filter((x) => x !== index)))
            }
          />
          {T.run.later}
        </label>

        <div className="vo-moves">
          <Button variant="ghost" disabled={index === 0} onClick={() => go(index - 1)}>
            {T.run.prev}
          </Button>
          <Button
            variant="secondary"
            disabled={index === total - 1}
            onClick={() => go(index + 1)}
            data-testid="vo-next"
          >
            {T.run.next}
          </Button>
          <Button variant="danger" onClick={() => setConfirm(true)} data-testid="vo-finish">
            {T.run.finish}
          </Button>
        </div>
      </article>

      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title={T.run.finishTitle}
        description={
          emptyList.length === 0 ? T.run.finishAll : T.run.finishEmpty(emptyList.join(', '))
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirm(false)}>
              {T.run.cancel}
            </Button>
            <Button
              variant="danger"
              data-testid="vo-confirm"
              onClick={() => {
                setConfirm(false);
                finish();
              }}
            >
              {T.run.finish}
            </Button>
          </>
        }
      />
    </div>
  );
}
