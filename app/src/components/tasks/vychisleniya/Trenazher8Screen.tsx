'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { Button, Input } from '@/components/ui';
import { pickRound, restartRound, useRound } from '@/lib/trainerRound';
import { recordTrainer8 } from '@/lib/progress';
import { progress8 } from '@/lib/vychisleniya/progress';
import { answerMatches, openText } from '@/lib/vychisleniya/secret';
import { kindTitle, type Task8 } from '@/lib/vychisleniya/session';
import { SKILL_FORMULA } from '@/content/vychisleniya';
import { HintIcon, RightIcon, WrongIcon } from '../prep/PrepIcons';
import { Formula } from './Formula';
import { Trenazher8Result, type Mark8 } from './Trenazher8Result';

export interface Trenazher8ScreenProps {
  pool: Task8[];
  roundKey: string;
  backHref: string;
  /** Контроль: без решения до конца сессии. */
  control?: boolean;
}

const VERDICT = {
  right: { title: 'Верно!' },
  wrong: { title: 'Есть ошибка' },
};

/** Разбор: закрыт тем же отпечатком, что и ответ; раскрывается по нажатию. */
function razborOf(task: Task8): string[] {
  try {
    const value: unknown = JSON.parse(openText(task.razbor, task.seal));
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

/**
 * Экран задания тренажёра №8.
 *
 * Условие и одно поле для ответа. Ответ сверяется с отпечатком:
 * числа в разметке нет. Разбор закрыт и открывается только по
 * просьбе ученика; открытое решение не засчитывается.
 */
export function Trenazher8Screen({ pool, roundKey, backHref, control = false }: Trenazher8ScreenProps) {
  const kinds = useMemo(() => pool.map((item) => kindTitle(item.prototype)), [pool]);
  const build = useCallback(() => pickRound(kinds, pool.length), [kinds, pool.length]);
  const order = useRound(roundKey, build);
  const tasks = useMemo(
    () => (order.length === 0 ? pool : order.map((at) => pool[at]).filter((item): item is Task8 => item !== undefined)),
    [order, pool],
  );

  const [index, setIndex] = useState(0);
  const [value, setValue] = useState('');
  const [checked, setChecked] = useState<'right' | 'wrong' | null>(null);
  const [marks, setMarks] = useState<Record<number, Mark8>>({});
  const [solution, setSolution] = useState<string[] | null>(null);
  const [misses, setMisses] = useState(0);
  const [result, setResult] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const startedAt = useRef<number | null>(null);
  const taskStartedAt = useRef<number | null>(null);
  const failed = useRef(false);

  function startClock() {
    const now = Date.now();
    startedAt.current ??= now;
    taskStartedAt.current ??= now;
  }

  function taskSeconds(): number {
    const from = taskStartedAt.current;
    return from === null ? 0 : (Date.now() - from) / 1000;
  }

  function remember(item: Task8, right: boolean, clean: boolean) {
    progress8.recordAttempt({ kind: item.prototype, taskId: item.id, right, clean, seconds: taskSeconds() });
    /* Единый журнал прогресса: пишется рядом, старую запись не
       заменяет (см. отчёт этапа 1). Навык — Skill (item.skill), а не
       прототип: это то, что ученик выбирает в конфигураторе. Семя
       лежит второй частью в id задачи (prototype|seed|level). */
    recordTrainer8({
      skillId: item.skill,
      taskId: item.id,
      verdict: 'correct',
      hintUsed: !right,
      firstTry: clean,
      seconds: taskSeconds(),
      seed: item.id.split('|')[1] ?? null,
    });
  }

  function stopClock() {
    const from = startedAt.current;
    setSeconds(from === null ? 0 : (Date.now() - from) / 1000);
  }

  const found = tasks[index];
  if (found === undefined) {
    return null;
  }
  const task: Task8 = found;
  const total = tasks.length;
  const last = index === total - 1;
  const ready = value.trim() !== '';
  /* Открытое решение до верного ответа — задача не засчитана. */
  const revealed = solution !== null && checked !== 'right';

  function check() {
    startClock();
    const right = answerMatches(value, task.seal);
    setChecked(right ? 'right' : 'wrong');
    if (right) {
      const clean = failed.current === false && solution === null;
      setMarks({ ...marks, [index]: clean || solution === null ? 'right' : 'hinted' });
      remember(task, solution === null, clean);
      if (last) {
        stopClock();
      }
    } else {
      failed.current = true;
      setMisses(misses + 1);
    }
  }

  function reveal() {
    startClock();
    const lines = razborOf(task);
    setSolution(lines);
    if (checked !== 'right') {
      /* Решение открыто до ответа: задача пройдена с подсказкой. */
      setMarks({ ...marks, [index]: 'hinted' });
      remember(task, false, false);
      if (last) {
        stopClock();
      }
    }
  }

  function next() {
    taskStartedAt.current = null;
    failed.current = false;
    setIndex(index + 1);
    setValue('');
    setChecked(null);
    setSolution(null);
  }

  function again() {
    restartRound(roundKey);
    setResult(false);
    setIndex(0);
    setValue('');
    setChecked(null);
    setMarks({});
    setMisses(0);
    setSeconds(0);
    setSolution(null);
    startedAt.current = null;
    taskStartedAt.current = null;
    failed.current = false;
  }

  const nextButton = last ? (
    <Button onClick={() => setResult(true)}>Смотреть результат →</Button>
  ) : (
    <Button onClick={next}>Следующее задание →</Button>
  );

  if (result) {
    return <Trenazher8Result tasks={tasks} marks={marks} misses={misses} seconds={seconds} backHref={backHref} onAgain={again} />;
  }

  const done = checked === 'right' || revealed;

  return (
    <section className="ttask">
      <p className="ttask__count">
        Задание <b>{index + 1}</b> из {total}
      </p>

      <ol className="ttask__dots" aria-hidden="true">
        {tasks.map((item, i) => (
          <li
            key={`${i}-${item.id}`}
            className={clsx('ttask__dot', marks[i] === 'right' && 'is-done', marks[i] === 'hinted' && 'is-hinted', i === index && 'is-current')}
          >
            {marks[i] === undefined ? i + 1 : <RightIcon />}
          </li>
        ))}
      </ol>

      <article className="ptask__card">
        <div className="ptask__text">
          <div className="ptask__question" dangerouslySetInnerHTML={{ __html: task.questionHtml }} />
        </div>
      </article>

      <div className="ttask__answer">
        <p className="ptask__label" id="ttask-answer-label">
          Ваш ответ:
        </p>
        <Input
          className="ttask__input"
          value={value}
          state={checked === null ? 'default' : checked === 'right' ? 'success' : 'error'}
          inputMode="text"
          autoComplete="off"
          aria-labelledby="ttask-answer-label"
          readOnly={checked === 'right'}
          onChange={(event) => {
            setValue(event.target.value);
            if (checked === 'wrong') {
              setChecked(null);
            }
          }}
        />

        {checked === null ? null : (
          <div className={clsx('tverdict', `tverdict--${checked}`)} role="status">
            <p className="tverdict__title">
              <span className="tverdict__ico">{checked === 'right' ? <RightIcon /> : <WrongIcon />}</span>
              {VERDICT[checked].title}
            </p>
            {control ? null : (
              <p className="tverdict__text">
                {checked === 'right'
                  ? revealed
                    ? 'Ответ верный, но решение было открыто — задача не засчитана.'
                    : 'Ответ сошёлся с отпечатком верного.'
                  : 'Проверьте вычисления: ответ не сошёлся. Можно исправить и проверить ещё раз.'}
              </p>
            )}
          </div>
        )}

        {/* Бесплатная подсказка: только формула навыка, без разбора чисел.
            Зачёт не снимает — в отличие от «Показать решение». В режиме
            «Контроль» подсказок нет вовсе. */}
        {checked === 'wrong' && !control ? (
          <aside className="ptask__hint">
            <p className="ptask__hint-head">
              <HintIcon />
              Подсказка
            </p>
            <div className="ptask__hint-text">
              <Formula tex={SKILL_FORMULA[task.skill] ?? ''} />
            </div>
          </aside>
        ) : null}

        {solution === null ? null : (
          <div className="z8-razbor" role="region" aria-label="Решение">
            <p className="z8-razbor__title">Решение</p>
            <ol className="z8-razbor__steps">
              {solution.map((line, i) => (
                <li key={i} dangerouslySetInnerHTML={{ __html: line }} />
              ))}
            </ol>
          </div>
        )}

        <div className="ttask__actions">
          {done ? (
            <>
              {nextButton}
              {solution === null && !control ? (
                <Button variant="ghost" onClick={reveal}>
                  Показать решение
                </Button>
              ) : null}
            </>
          ) : (
            <>
              <Button onClick={check} disabled={!ready}>
                Проверить
              </Button>
              {control ? null : (
                <span className="thint__offer">
                  <Button variant="ghost" onClick={reveal}>
                    Показать решение
                  </Button>
                  <span className="thint__warn">Задача не будет засчитана.</span>
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
