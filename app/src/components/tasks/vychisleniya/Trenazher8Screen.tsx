'use client';

import { useCallback, useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { Button } from '@/components/ui';
import { BookmarkButton } from '@/components/zakladki/BookmarkButton';
import { formatHint, fractionRightHint } from '@/lib/otvet';
import { pickRound, useRound } from '@/lib/trainerRound';
import { zadachaHref } from '@/lib/vychisleniya/links';
import { log8 } from '@/lib/vychisleniya/progress';
import { openText, readSealed } from '@/lib/vychisleniya/secret';
import { kindTitle, type Task8 } from '@/lib/vychisleniya/session';
import type { LogOutcome } from '@/lib/progressLog';
import { AnswerInput, FormatHint } from '../otvet/AnswerInput';
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
  /* Подсказка о записи ответа: дробь, «5 см», «3 1/2». Не ошибка, попытка
     не тратится; не хранится — при возврате ученик просто проверит снова. */
  const [hint, setHint] = useState<string | null>(null);
  /* Неверный ответ был записан дробью: к вердикту — напоминание о записи. */
  const [viaFraction, setViaFraction] = useState(false);

  function startClock() {
    if (taskFrom === null) {
      setTaskFrom(elapsed());
    }
  }

  function taskSeconds(): number {
    return taskFrom === null ? 0 : (elapsed() - taskFrom) / 1000;
  }

  /* Журнал попыток (lib/progressLog): из него считаются прогресс по
     типам, «Стоит повторить» и «Мои ошибки». Аналог из «Работы над
     ошибками» записывается с задачей, ошибку в которой он закрывает. */
  function remember(item: Task8, outcome: LogOutcome) {
    log8.record({
      task: item.id,
      kind: item.prototype,
      outcome,
      seconds: Math.round(taskSeconds()),
      session: roundKey,
      ...(item.fixes === undefined ? {} : { fixes: item.fixes }),
    });
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
    const reading = readSealed(value, task.seal, 'trenazher');
    if (reading.kind === 'format') {
      /* Неверная запись: подсказка, попытка не тратится. */
      setHint(formatHint(reading.problem, reading.meant));
      return;
    }
    if (reading.kind === 'fractionRight') {
      /* Значение верное, но дробью: не засчитано и не ошибка. */
      setHint(fractionRightHint(reading.decimal));
      return;
    }
    setHint(null);
    const right = reading.right;
    setViaFraction(!right && reading.viaFraction);
    setChecked(right ? 'right' : 'wrong');
    if (right) {
      const clean = !failed && solution === null;
      setMarks({ ...marks, [index]: clean || solution === null ? 'right' : 'hinted' });
      /* Решение открыто раньше — исход уже записан как «открыто решение». */
      if (solution === null) remember(task, clean ? 'right' : 'wrong');
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
      remember(task, 'revealed');
    }
  }

  function next() {
    setTaskFrom(null);
    setFailed(false);
    setIndex(index + 1);
    setValue('');
    setChecked(null);
    setSolutionOpen(false);
    setHint(null);
    setViaFraction(false);
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
        <div className="z8-task__tools">
          <BookmarkButton
            section="8"
            place="trenazher"
            refId={task.id}
            title={`№8 · тренажёр, тип ${task.prototype}`}
            href={zadachaHref(task.id)}
          />
        </div>
      </article>

      <div className="ttask__answer">
        <p className="ptask__label" id="ttask-answer-label">
          Ваш ответ:
        </p>
        <form
          className="z8-answer"
          onSubmit={(event) => {
            event.preventDefault();
            if (ready && !done) check();
          }}
        >
          <AnswerInput
            className="ttask__input"
            value={value}
            state={checked === null ? 'default' : checked === 'right' ? 'success' : 'error'}
            aria-labelledby="ttask-answer-label"
            readOnly={checked === 'right'}
            onChange={(next) => {
              setValue(next);
              setHint(null);
              if (checked === 'wrong') {
                setChecked(null);
              }
            }}
          />
        </form>
        {hint === null ? null : <FormatHint text={hint} />}

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
                  : viaFraction
                    ? 'Ответ не сошёлся. И ещё: в бланк ЕГЭ записывают десятичную дробь, а не обыкновенную.'
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
