'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { Button, FigureZoom, Input } from '@/components/ui';
import { assetUrl } from '@/lib/assetUrl';
import { progress9 } from '@/lib/proizvodnaya/progress';
import { answerMatches, openText } from '@/lib/proizvodnaya/secret';
import { kindTitle, type ShagHtml9, type Task9 } from '@/lib/proizvodnaya/session';
import {
  finish,
  getActive,
  update,
  type ActiveSession9,
  type Item9,
  type Mark9,
  type Result9,
  type RowIto9,
} from '@/lib/proizvodnaya/sessionStore';
import { counted } from '@/lib/plural';
import { HintIcon, RightIcon, WrongIcon } from '../prep/PrepIcons';
import { HintFlow9 } from './HintFlow9';
import { Risunok9 } from './Risunok9';

export interface Trenazher9ScreenProps {
  session: ActiveSession9;
}

/** Разбор: закрыт тем же отпечатком, что и ответ; раскрывается по нажатию. */
function razborOf(task: Task9): ShagHtml9[] {
  if (task.razborHtml === '') {
    return [];
  }
  try {
    const value: unknown = JSON.parse(openText(task.razborHtml, task.seal));
    if (Array.isArray(value)) {
      return value.filter(
        (item): item is ShagHtml9 =>
          typeof item === 'object' &&
          item !== null &&
          'strokiHtml' in item &&
          Array.isArray((item as ShagHtml9).strokiHtml),
      );
    }
  } catch {
    /* Не раскрылось — разбора нет. */
  }
  return [];
}

function clock(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(whole / 60);
  const rest = whole % 60;
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

/** Итог по сессии: считаются только закрытые задания. */
function resultOf(session: ActiveSession9, early: boolean): Result9 {
  const rows: RowIto9[] = [];
  let right = 0;
  let hinted = 0;
  let solved = 0;
  let misses = 0;
  session.tasks.forEach((task, i) => {
    const item = session.items[i];
    if (item === undefined) {
      return;
    }
    misses += item.misses;
    if (item.mark === null) {
      return;
    }
    solved += 1;
    const title = kindTitle(task.prototype);
    const found = rows.find((row) => row.title === title);
    const row = found ?? { title, right: 0, total: 0 };
    if (found === undefined) {
      rows.push(row);
    }
    row.total += 1;
    if (item.mark === 'right') {
      right += 1;
      row.right += 1;
    } else {
      hinted += 1;
    }
  });
  return {
    settings: session.settings,
    total: session.tasks.length,
    solved,
    right,
    hinted,
    misses,
    seconds: session.seconds,
    early,
    rows,
  };
}

/** Поправить задание под номером индекса текущей сессии. */
function patchItem(patch: Partial<Item9>): void {
  update((s) => ({
    ...s,
    items: s.items.map((item, i) => (i === s.index ? { ...item, ...patch } : item)),
  }));
}

/**
 * Экран задания тренажёра №9.
 *
 * Состояние живёт в sessionStore, а не в компоненте: при переходе на
 * другую вкладку раздела экран размонтируется, а при возврате
 * продолжается с того же задания. Условие и одно поле для ответа;
 * рисунок условия — без построений. Ответ сверяется с отпечатком:
 * числа в разметке нет. Подсказка — вопросы с кнопками; рисунок
 * подсказки показывает построения по шагам. Разбор закрыт и
 * открывается по просьбе; открытое решение не засчитывается. В
 * режиме «Контроль» подсказок и решения нет до конца.
 */
export function Trenazher9Screen({ session }: Trenazher9ScreenProps) {
  const { index, paused, tasks, items, settings } = session;
  const control = settings.mode === 'control';
  const task = tasks[index];
  const item = items[index];

  /* ── Время: копится только пока экран открыт, вкладка видна и нет паузы. */
  const sinceRef = useRef<number | null>(null);
  const running = !paused;

  const flush = useCallback(() => {
    const from = sinceRef.current;
    if (from === null) {
      return;
    }
    const at = Date.now();
    const dt = Math.max(0, (at - from) / 1000);
    sinceRef.current = at;
    if (dt === 0) {
      return;
    }
    update((s) => ({
      ...s,
      seconds: s.seconds + dt,
      items: s.items.map((it, i) => (i === s.index ? { ...it, sec: it.sec + dt } : it)),
    }));
  }, []);

  useEffect(() => {
    if (!running) {
      sinceRef.current = null;
      return undefined;
    }
    sinceRef.current = Date.now();
    const onVisibility = () => {
      if (document.hidden) {
        flush();
        sinceRef.current = null;
      } else {
        sinceRef.current = Date.now();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', flush);
    return () => {
      flush();
      sinceRef.current = null;
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', flush);
    };
  }, [running, flush]);

  /* ── Завершение ── */
  const [confirming, setConfirming] = useState(false);
  const unsolved = items.filter((it) => it.mark === null).length;

  function finishNow(early: boolean) {
    flush();
    const fresh = getActive();
    if (fresh === null) {
      return;
    }
    finish(resultOf(fresh, early));
  }

  function askFinish() {
    if (unsolved === 0) {
      finishNow(false);
    } else {
      setConfirming(true);
    }
  }

  const solution = useMemo(
    () => (item !== undefined && task !== undefined && item.solution ? razborOf(task) : null),
    [item, task],
  );

  if (task === undefined || item === undefined) {
    return null;
  }

  const total = tasks.length;
  const last = index === total - 1;
  const ready = item.value.trim() !== '';
  const done = item.checked === 'right' || item.solution;
  const hasHint = task.podskazka.length > 0;
  /* Открытое решение до верного ответа — задача не засчитана. */
  const revealed = item.solution && item.checked !== 'right';

  function pause() {
    flush();
    update((s) => ({ ...s, paused: true }));
  }

  function resume() {
    update((s) => ({ ...s, paused: false }));
  }

  function check() {
    flush();
    const fresh = getActive();
    const cur = fresh?.items[fresh.index];
    const current = fresh?.tasks[fresh.index];
    if (fresh === null || cur === undefined || current === undefined) {
      return;
    }
    if (answerMatches(cur.value, current.seal)) {
      const hinted = cur.hintOn || cur.solution;
      const clean = cur.misses === 0 && !hinted;
      const mark: Mark9 = hinted ? 'hinted' : 'right';
      patchItem({ checked: 'right', mark: cur.mark ?? mark });
      if (cur.mark === null) {
        progress9.recordAttempt({
          kind: current.prototype,
          taskId: current.id,
          right: !cur.solution,
          clean,
          seconds: cur.sec,
        });
      }
    } else {
      patchItem({ checked: 'wrong', misses: cur.misses + 1 });
    }
  }

  function reveal() {
    flush();
    const fresh = getActive();
    const cur = fresh?.items[fresh.index];
    const current = fresh?.tasks[fresh.index];
    if (fresh === null || cur === undefined || current === undefined) {
      return;
    }
    patchItem({ solution: true, mark: cur.mark ?? 'hinted' });
    if (cur.mark === null) {
      progress9.recordAttempt({
        kind: current.prototype,
        taskId: current.id,
        right: false,
        clean: false,
        seconds: cur.sec,
      });
    }
  }

  function pickHint(k: number) {
    const q = task?.podskazka[item?.hintStep ?? 0];
    if (q === undefined || item === undefined) {
      return;
    }
    if (q.varianty[k]?.verno === true) {
      patchItem({ hintStep: item.hintStep + 1, hintWrong: [] });
    } else if (!item.hintWrong.includes(k)) {
      patchItem({ hintWrong: [...item.hintWrong, k] });
    }
  }

  function next() {
    flush();
    update((s) => ({ ...s, index: Math.min(s.index + 1, s.tasks.length - 1) }));
  }

  /* ── Пауза: условие скрыто, чтобы пауза не помогала решать. ── */
  if (paused) {
    return (
      <section className="ttask z9-pause" aria-labelledby="z9-pause-title">
        <h3 className="z9-pause__title" id="z9-pause-title">
          Тренировка на паузе
        </h3>
        <p className="z9-pause__text">
          Время остановлено. Вы решили {counted(total - unsolved, 'задание', 'задания', 'заданий')}{' '}
          из {total}. Условие скрыто, пока вы не продолжите.
        </p>
        <p className="z9-pause__time">Время: {clock(session.seconds)}</p>
        {confirming ? (
          <FinishConfirm
            unsolved={unsolved}
            onYes={() => finishNow(true)}
            onNo={() => setConfirming(false)}
          />
        ) : (
          <div className="ttask__actions">
            <Button onClick={resume}>Продолжить</Button>
            <Button variant="secondary" onClick={askFinish}>
              Завершить тренировку
            </Button>
          </div>
        )}
      </section>
    );
  }

  /* ── Какой рисунок показывать. ── */
  const currentQuestion =
    hasHint && item.hintOn
      ? task.podskazka[Math.min(item.hintStep, task.podskazka.length - 1)]
      : undefined;
  const drawing = task.risunok;
  const mode: 'student' | 'hint' | 'teacher' =
    done && !control ? 'teacher' : item.hintOn && !done && !control ? 'hint' : 'student';

  const nextButton = last ? (
    <Button onClick={() => finishNow(false)}>Смотреть результат →</Button>
  ) : (
    <Button onClick={next}>Следующее задание →</Button>
  );

  return (
    <section className="ttask z9-ttask">
      <div className="z9-bar">
        <p className="ttask__count">
          Задание <b>{index + 1}</b> из {total} · {kindTitle(task.prototype)}
        </p>
        <p className="z9-bar__time" aria-label="Затраченное время">
          <Timer key={session.seconds} seconds={session.seconds} running={running} />
        </p>
        <div className="z9-bar__buttons">
          <Button variant="ghost" size="sm" onClick={pause}>
            Поставить на паузу
          </Button>
          <Button variant="ghost" size="sm" onClick={askFinish}>
            Завершить тренировку
          </Button>
        </div>
      </div>

      {confirming ? (
        <FinishConfirm
          unsolved={unsolved}
          onYes={() => finishNow(true)}
          onNo={() => setConfirming(false)}
        />
      ) : null}

      <ol className="ttask__dots" aria-hidden="true">
        {tasks.map((it, i) => (
          <li
            key={`${i}-${it.id}`}
            className={clsx(
              'ttask__dot',
              items[i]?.mark === 'right' && 'is-done',
              items[i]?.mark === 'hinted' && 'is-hinted',
              i === index && 'is-current',
            )}
          >
            {items[i]?.mark ? <RightIcon /> : i + 1}
          </li>
        ))}
      </ol>

      <article className="ptask__card">
        <div className="ptask__text">
          <div
            className="ptask__question"
            dangerouslySetInnerHTML={{ __html: task.questionHtml }}
          />
          {drawing === null ? null : (
            <FigureZoom
              className="chart ptask__chart z9-ptask__pic"
              label={`Рисунок к заданию ${index + 1}`}
            >
              <Risunok9
                figura={drawing}
                rezhim={mode}
                {...(mode === 'hint' && currentQuestion !== undefined
                  ? {
                      shag:
                        item.hintStep >= task.podskazka.length
                          ? Number.POSITIVE_INFINITY
                          : currentQuestion.shag,
                    }
                  : {})}
              />
            </FigureZoom>
          )}
          {task.kartinka === null ? null : (
            <div className="chart ptask__chart z9-ptask__pic">
              <Image
                className="z9-kartinka"
                src={assetUrl(task.kartinka)}
                alt={`Рисунок к заданию ${index + 1}`}
                width={720}
                height={480}
              />
            </div>
          )}
        </div>
      </article>

      <form
        className="ttask__answer"
        onSubmit={(event) => {
          event.preventDefault();
          if (ready && !done) {
            check();
          }
        }}
      >
        <p className="ptask__label" id="z9-answer-label">
          Ваш ответ:
        </p>
        <Input
          className="ttask__input"
          value={item.value}
          state={item.checked === null ? 'default' : item.checked === 'right' ? 'success' : 'error'}
          inputMode="decimal"
          autoComplete="off"
          aria-labelledby="z9-answer-label"
          aria-describedby="z9-answer-hint"
          readOnly={item.checked === 'right'}
          onChange={(event) => {
            patchItem({
              value: event.target.value,
              ...(item.checked === 'wrong' ? { checked: null } : {}),
            });
          }}
        />
        <p className="z9-ttask__hint t-caption" id="z9-answer-hint">
          Ответ — целое число или десятичная дробь; запятая и точка равноправны.
        </p>

        {item.checked === null ? null : (
          <div className={clsx('tverdict', `tverdict--${item.checked}`)} role="status">
            <p className="tverdict__title">
              <span className="tverdict__ico">
                {item.checked === 'right' ? <RightIcon /> : <WrongIcon />}
              </span>
              {item.checked === 'right' ? 'Верно!' : 'Есть ошибка'}
            </p>
            {control ? null : (
              <p className="tverdict__text">
                {item.checked === 'right'
                  ? revealed
                    ? 'Ответ верный, но решение было открыто, поэтому задача не засчитана.'
                    : item.hintOn
                      ? 'Верно, но с подсказкой: задача будет отмечена как решённая с подсказкой.'
                      : 'Ответ верный.'
                  : 'Ответ не сошёлся. Можно исправить и проверить ещё раз.'}
              </p>
            )}
          </div>
        )}

        {/* Подсказка — вопросы с кнопками; в «Контроле» её нет. */}
        {item.hintOn && hasHint && !control ? (
          <HintFlow9
            voprosy={task.podskazka}
            step={item.hintStep}
            wrong={item.hintWrong}
            onPick={pickHint}
          />
        ) : null}

        {solution === null ? null : (
          <div className="z9-razbor" role="region" aria-label="Решение">
            <p className="z9-razbor__title">
              <HintIcon />
              Решение
            </p>
            {solution.length === 0 ? (
              <p className="z9-razbor__line">Для этой задачи разбора пока нет.</p>
            ) : (
              <ol className="z9-razbor__steps">
                {solution.map((shag, i) => (
                  <li className="z9-razbor__step" key={i}>
                    {shag.zagolovokHtml === '' ? null : (
                      <p
                        className="z9-razbor__head"
                        dangerouslySetInnerHTML={{ __html: shag.zagolovokHtml }}
                      />
                    )}
                    {shag.strokiHtml.map((line, j) => (
                      <p
                        className="z9-razbor__line"
                        key={j}
                        dangerouslySetInnerHTML={{ __html: line }}
                      />
                    ))}
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}

        <div className="ttask__actions">
          {done ? (
            <>
              {nextButton}
              {!item.solution && !control ? (
                <Button variant="ghost" onClick={reveal}>
                  Показать решение
                </Button>
              ) : null}
            </>
          ) : (
            <>
              <Button type="submit" disabled={!ready}>
                Проверить
              </Button>
              {control ? null : (
                <>
                  {hasHint && !item.hintOn ? (
                    <span className="thint__offer">
                      <Button variant="ghost" onClick={() => patchItem({ hintOn: true })}>
                        Подсказка
                      </Button>
                      <span className="thint__warn">Задача будет отмечена «с подсказкой».</span>
                    </span>
                  ) : null}
                  <span className="thint__offer">
                    <Button variant="ghost" onClick={reveal}>
                      Показать решение
                    </Button>
                    <span className="thint__warn">Задача не будет засчитана.</span>
                  </span>
                </>
              )}
            </>
          )}
        </div>
      </form>
    </section>
  );
}

/** Бегущее время: основа приходит из сессии, секунды между записями считает сам. */
function Timer({ seconds, running }: { seconds: number; running: boolean }) {
  const [extra, setExtra] = useState(0);
  useEffect(() => {
    if (!running) {
      return undefined;
    }
    const id = window.setInterval(() => setExtra((value) => value + 1), 1000);
    return () => window.clearInterval(id);
  }, [running]);
  return <>{clock(seconds + extra)}</>;
}

function FinishConfirm({
  unsolved,
  onYes,
  onNo,
}: {
  unsolved: number;
  onYes: () => void;
  onNo: () => void;
}) {
  return (
    <div className="z9-confirm" role="alertdialog" aria-labelledby="z9-confirm-title">
      <p className="z9-confirm__title" id="z9-confirm-title">
        Завершить тренировку досрочно?
      </p>
      <p className="z9-confirm__text">
        Не решено: {counted(unsolved, 'задание', 'задания', 'заданий')}. В итог войдут только
        решённые задания, а сессия будет закрыта.
      </p>
      <div className="ttask__actions">
        <Button variant="danger" onClick={onYes}>
          Да, завершить
        </Button>
        <Button variant="secondary" onClick={onNo}>
          Продолжить решать
        </Button>
      </div>
    </div>
  );
}
