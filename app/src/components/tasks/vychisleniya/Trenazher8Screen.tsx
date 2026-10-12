'use client';

import { useCallback, useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { Button, Input } from '@/components/ui';
import { pickRound, useRound } from '@/lib/trainerRound';
import { progress8 } from '@/lib/vychisleniya/progress';
import { answerMatches, openText } from '@/lib/vychisleniya/secret';
import { kindTitle, type Task8 } from '@/lib/vychisleniya/session';
import { SKILL_FORMULA } from '@/content/vychisleniya';
import { HintIcon, RightIcon, WrongIcon } from '../prep/PrepIcons';
import { Formula } from './Formula';
import { useSessionReport } from '../session/useSessionReport';
import type { TaskMark } from '@/lib/trainerSession/types';
import type { Trenazher8Ui } from './trenazher8Ui';

export interface Trenazher8ScreenProps {
  pool: Task8[];
  roundKey: string;
  /** Состояние экрана из сохранённой тренировки. null — тренировка новая. */
  restored: Trenazher8Ui | null;
  /** Сообщить оболочке сессии о новом состоянии (она его сохранит). */
  report: (ui: Trenazher8Ui) => void;
  /** Активное время тренировки, мс: пауза и скрытая вкладка не идут. */
  elapsed: () => number;
  /** Последнее задание решено: показать итоги. */
  onFinish: () => void;
  /** Контроль: без решения до конца сессии. */
  control?: boolean;
}

const VERDICT = {
  right: { title: 'Верно!' },
  wrong: { title: 'Есть ошибка' },
};

/** Разбор: закрыт тем же отпечатком, что и ответ; раскрывается по нажатию. */
export function razborOf(task: Task8): string[] {
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
export function Trenazher8Screen({
  pool,
  roundKey,
  restored,
  report,
  elapsed,
  onFinish,
  control = false,
}: Trenazher8ScreenProps) {
  const kinds = useMemo(() => pool.map((item) => kindTitle(item.prototype)), [pool]);
  const build = useCallback(() => pickRound(kinds, pool.length), [kinds, pool.length]);
  const order = useRound(roundKey, build, restored?.order);
  const tasks = useMemo(
    () => (order.length === 0 ? pool : order.map((at) => pool[at]).filter((item): item is Task8 => item !== undefined)),
    [order, pool],
  );

  /* Всё, что ученик успел сделать, приходит из сохранённой тренировки:
     вернувшись в тренажёр, он продолжает с того же места. */
  const [index, setIndex] = useState(restored?.index ?? 0);
  const [value, setValue] = useState(restored?.value ?? '');
  const [checked, setChecked] = useState<'right' | 'wrong' | null>(restored?.checked ?? null);
  const [marks, setMarks] = useState<Record<number, TaskMark>>(restored?.marks ?? {});
  /* Задания, в которых была ошибка: на итогах они отличаются от пропущенных. */
  const [tried, setTried] = useState<Record<number, true>>(restored?.tried ?? {});
  /* Решение хранится флагом: текст закрыт отпечатком и раскрывается заново. */
  const [solutionOpen, setSolutionOpen] = useState(restored?.solutionOpen ?? false);
  const [misses, setMisses] = useState(restored?.misses ?? 0);
  /* Время тренировки считает оболочка сессии; здесь — время на одно
     задание, от первой проверки. */
  const [taskFrom, setTaskFrom] = useState<number | null>(restored?.taskFrom ?? null);
  const [failed, setFailed] = useState(restored?.failed ?? false);

  function startClock() {
    if (taskFrom === null) {
      setTaskFrom(elapsed());
    }
  }

  function taskSeconds(): number {
    return taskFrom === null ? 0 : (elapsed() - taskFrom) / 1000;
  }

  function remember(item: Task8, right: boolean, clean: boolean) {
    progress8.recordAttempt({ kind: item.prototype, taskId: item.id, right, clean, seconds: taskSeconds() });
  }

  /* Всё состояние экрана — оболочке сессии: она сохраняет его при
     каждом изменении, а при возвращении отдаёт обратно (restored). */
  useSessionReport<Trenazher8Ui>(report, {
    index,
    marks,
    tried,
    order: order.length === 0 ? null : order,
    value,
    checked,
    solutionOpen,
    misses,
    failed,
    taskFrom,
  });

  const found = tasks[index];
  if (found === undefined) {
    return null;
  }
  const task: Task8 = found;
  const total = tasks.length;
  const last = index === total - 1;
  const ready = value.trim() !== '';
  /* Открытое решение до верного ответа — задача не засчитана. */
  const solution = solutionOpen ? razborOf(task) : null;
  const revealed = solution !== null && checked !== 'right';

  function check() {
    startClock();
    const right = answerMatches(value, task.seal);
    setChecked(right ? 'right' : 'wrong');
    if (right) {
      const clean = !failed && solution === null;
      setMarks({ ...marks, [index]: clean || solution === null ? 'right' : 'hinted' });
      remember(task, solution === null, clean);
    } else {
      setFailed(true);
      setMisses(misses + 1);
      setTried({ ...tried, [index]: true });
    }
  }

  function reveal() {
    startClock();
    setSolutionOpen(true);
    if (checked !== 'right') {
      /* Решение открыто до ответа: задача пройдена с подсказкой. */
      setMarks({ ...marks, [index]: 'hinted' });
      remember(task, false, false);
    }
  }

  function next() {
    setTaskFrom(null);
    setFailed(false);
    setIndex(index + 1);
    setValue('');
    setChecked(null);
    setSolutionOpen(false);
  }

  const nextButton = last ? (
    <Button onClick={onFinish}>Смотреть результат →</Button>
  ) : (
    <Button onClick={next}>Следующее задание →</Button>
  );

  const done = checked === 'right' || revealed;

  return (
    <section className="ttask">
      {/* Номер задания, решённое и время показывает панель тренировки
          над экраном (components/tasks/session). */}
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
