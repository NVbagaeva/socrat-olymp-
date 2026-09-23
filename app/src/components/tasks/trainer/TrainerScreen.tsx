'use client';

import { Fragment, useCallback, useMemo, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { Button, FigureZoom, Input } from '@/components/ui';
import { sameNumber } from '@/lib/answer';
import type { TrainerStep, TrainerTask } from '@/lib/trainer';
import { trainerKindTitle } from '@/content/trainerModes';
import { recordAttempt } from '@/lib/trainerProgress';
import { pickRound, restartRound, useRound } from '@/lib/trainerRound';
import { RightIcon, WrongIcon } from '../prep/PrepIcons';
import { PrepSolution } from '../prep/PrepSolution';
import { TrainerResult, type TrainerMark } from './TrainerResult';

export interface TrainerScreenProps {
  /** Все задания сессии: подход раскладывается из них в браузере. */
  pool: TrainerTask[];
  /** Под каким именем помнить подход: у каждой сессии свой. */
  roundKey: string;
  /** Куда ведёт кнопка с итогового экрана. */
  backHref: string;
  /** Сколько заданий в подходе. По умолчанию — весь пул. */
  roundSize?: number;
  /**
   * Контроль: без подсказок и без пояснений к ответу до конца
   * сессии — только «верно» или «есть ошибка».
   */
  control?: boolean;
}

/* Обе плашки обратной связи: заголовки дословные, без «Неверно». */
const VERDICT = {
  right: { title: 'Верно!' },
  wrong: { title: 'Есть ошибка' },
};

/**
 * Экран задания тренажёра.
 *
 * Основной ход: условие, чертёж и одно поле — для итогового ответа.
 * Решает ученик на бумаге, как и на экзамене.
 *
 * Кто не справился — открывает подсказку. Это не текст, а цепочка
 * шагов: снять k, снять b, записать уравнение, ответить. Каждый шаг
 * со своим полем и своей проверкой, следующий появляется после
 * верного ответа на текущий. Вернуться к обычному вводу после этого
 * нельзя, и задача не засчитывается — об этом сказано заранее.
 *
 * Все задания подхода приходят готовыми пропсами и живут на одном
 * экране: смена задания — это состояние, а не переход по адресу.
 */
export function TrainerScreen({
  pool,
  roundKey,
  backHref,
  roundSize = pool.length,
  control = false,
}: TrainerScreenProps) {
  /* Типы заданий пула: по ним подход раскладывается так, чтобы
     одинаковые не шли подряд. Абсцисса и ордината — один тип. */
  const kinds = useMemo(
    () => pool.map((item) => trainerKindTitle[item.kind] ?? item.kind),
    [pool],
  );
  const build = useCallback(() => pickRound(kinds, roundSize), [kinds, roundSize]);
  const order = useRound(roundKey, build);
  /* Пока подход не собран — на сервере и при гидратации — показываем
     начало пула: экран не мигает пустотой, а через мгновение браузер
     отдаёт разложенный подход. */
  const tasks = useMemo(
    () =>
      order.length === 0
        ? pool.slice(0, roundSize)
        : order.map((at) => pool[at]).filter((item): item is TrainerTask => item !== undefined),
    [order, pool, roundSize],
  );

  const [index, setIndex] = useState(0);
  const [value, setValue] = useState('');
  const [checked, setChecked] = useState<'right' | 'wrong' | null>(null);
  /* Чем закончилось каждое задание подхода: полоса берёт вид оттуда. */
  const [marks, setMarks] = useState<Record<number, TrainerMark>>({});

  /* Подсказка: открыта ли она, какой шаг идёт, что набрано в полях
     и как проверился текущий шаг. */
  const [hint, setHint] = useState(false);
  /* Разбор параболы: у неё нет цепочки шагов с полями, зато есть
     тот же разбор, что во вкладке опорных задач. */
  const [solution, setSolution] = useState(false);
  const [solutionStep, setSolutionStep] = useState(0);
  const [step, setStep] = useState(0);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [stepMark, setStepMark] = useState<'right' | 'wrong' | null>(null);

  /* Сколько раз ответ не сошёлся и сколько заняла тренировка. Время
     идёт от первой проверки: до неё ученик ещё читает условие, да
     и часы на сервере ни при чём — расхождения гидратации нет. */
  const [misses, setMisses] = useState(0);
  /* Итог подхода: открывается с последнего задания. */
  const [result, setResult] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const startedAt = useRef<number | null>(null);
  const taskStartedAt = useRef<number | null>(null);
  /* Была ли ошибка в текущем задании: начисто пройденное уходит
     из списка ошибочных, остальное в нём остаётся. */
  const failed = useRef(false);

  function startClock() {
    const now = Date.now();
    if (startedAt.current === null) {
      startedAt.current = now;
    }
    if (taskStartedAt.current === null) {
      taskStartedAt.current = now;
    }
  }

  /** Сколько секунд ушло на текущее задание. */
  function taskSeconds(): number {
    const from = taskStartedAt.current;
    return from === null ? 0 : (Date.now() - from) / 1000;
  }

  /* Закрытое задание уходит в хранилище: счётчики вкладки считаются
     оттуда и обновляются сразу, без перезагрузки. */
  function remember(item: TrainerTask, right: boolean, clean: boolean) {
    recordAttempt({ kind: item.kind, taskId: item.id, right, clean, seconds: taskSeconds() });
  }

  function stopClock() {
    const from = startedAt.current;
    setSeconds(from === null ? 0 : (Date.now() - from) / 1000);
  }

  const found = tasks[index];
  if (found === undefined) {
    /* Набор пуст — показывать нечего. В данных такого не бывает, но
       обращение по индексу в TypeScript честно необязательно. */
    return null;
  }
  const task: TrainerTask = found;
  const total = tasks.length;
  const last = index === total - 1;
  const ready = value.trim() !== '';

  const steps = task.steps;
  /* Цепочка пройдена: шагов больше не осталось. */
  const solvedByHint = hint && step >= steps.length;
  const current: TrainerStep | undefined = steps[step];

  function fieldValue(stepNo: number, fieldNo: number): string {
    return fields[`${stepNo}:${fieldNo}`] ?? '';
  }

  function setFieldValue(stepNo: number, fieldNo: number, next: string) {
    setFields({ ...fields, [`${stepNo}:${fieldNo}`]: next });
    /* Ученик правит ответ — прошлая отметка уже не про него. */
    if (stepMark === 'wrong') {
      setStepMark(null);
    }
  }

  function check() {
    startClock();
    /* У задачи с выбором ответ движка — номер варианта, и сравнивать
       его надо как строку: «02» и «2» — разные варианты. */
    const right = task.options === null
      ? sameNumber(value, task.answer)
      : value === task.answer;
    setChecked(right ? 'right' : 'wrong');
    if (right) {
      setMarks({ ...marks, [index]: 'right' });
      remember(task, true, failed.current === false);
      if (last) {
        stopClock();
      }
    } else {
      failed.current = true;
      setMisses(misses + 1);
    }
  }

  /* Открытый разбор стоит того же, что подсказка: задача в зачёт не
     идёт, и ученик знает это заранее. */
  function openSolution() {
    startClock();
    setSolution(true);
    setSolutionStep(0);
    setChecked(null);
    failed.current = true;
    setMarks({ ...marks, [index]: 'hinted' });
    remember(task, false, false);
    if (last) {
      stopClock();
    }
  }

  function openHint() {
    setHint(true);
    setChecked(null);
    setStep(0);
    setStepMark(null);
    setFields({});
  }

  function checkStep() {
    if (current === undefined) {
      return;
    }
    startClock();
    const right = current.fields.every((field, fieldNo) =>
      sameNumber(fieldValue(step, fieldNo), field.answer),
    );
    if (!right) {
      setStepMark('wrong');
      failed.current = true;
      setMisses(misses + 1);
      return;
    }
    setStepMark(null);
    setStep(step + 1);
    if (step + 1 >= steps.length) {
      /* Задача пройдена по шагам: в верных она не числится. */
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
    setHint(false);
    setSolution(false);
    setSolutionStep(0);
    setStep(0);
    setFields({});
    setStepMark(null);
  }

  const nextButton = last ? (
    <Button onClick={() => setResult(true)}>Смотреть результат →</Button>
  ) : (
    <Button onClick={next}>Следующее задание →</Button>
  );

  function again() {
    /* Новый подход: другие задания и другой порядок. */
    restartRound(roundKey);
    setResult(false);
    setIndex(0);
    setValue('');
    setChecked(null);
    setMarks({});
    setMisses(0);
    setSeconds(0);
    setHint(false);
    setSolution(false);
    setSolutionStep(0);
    setStep(0);
    setFields({});
    setStepMark(null);
    startedAt.current = null;
    taskStartedAt.current = null;
    failed.current = false;
  }

  if (result) {
    return (
      <TrainerResult
        tasks={tasks}
        marks={marks}
        misses={misses}
        seconds={seconds}
        backHref={backHref}
        onAgain={again}
      />
    );
  }

  return (
    <section className="ttask">
      <p className="ttask__count">
        Задание <b>{index + 1}</b> из {total}
      </p>

      {/* Кружки подхода — те же, что у шагов в подготовке: решённое
          залито зелёным с галочкой, пройденное с подсказкой — синим,
          текущее обведено. Выбирать задание нельзя, поэтому это не
          кнопки. */}
      <ol className="ttask__dots" aria-hidden="true">
        {tasks.map((item, i) => (
          <li
            key={`${i}-${item.id}`}
            data-kind={item.kind}
            className={clsx(
              'ttask__dot',
              marks[i] === 'right' && 'is-done',
              marks[i] === 'hinted' && 'is-hinted',
              i === index && 'is-current',
            )}
          >
            {marks[i] === undefined ? i + 1 : <RightIcon />}
          </li>
        ))}
      </ol>

      <article className="ptask__card">
        <div className="ptask__text">
          {/* Условие собрал движок, формулы набрал KaTeX — обе
              на сборке. */}
          <div className="ptask__question" dangerouslySetInnerHTML={{ __html: task.questionHtml }} />
          {task.chartSvg === null ? null : (
            <FigureZoom className="chart ptask__chart" label={`Чертёж к заданию ${index + 1}`}>
              <span dangerouslySetInnerHTML={{ __html: task.chartSvg }} />
            </FigureZoom>
          )}
        </div>
      </article>

      {hint ? null : (
        <div className="ttask__answer">
          <p className="ptask__label" id="ttask-answer-label">
            Ваш ответ:
          </p>
          {task.options === null ? (
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
          ) : (
            /* Ответ выбором варианта: та же разметка, что у опорных
               задач, — список кнопок, выбранная обведена. */
            <ul className="ptask__options" aria-labelledby="ttask-answer-label">
              {task.options.map((option) => (
                <li key={option.number}>
                  <button
                    type="button"
                    /* Разметка и классы те же, что у опорных задач:
                       второго оформления для одного и того же списка
                       вариантов в проекте нет. */
                    className={clsx(
                      'popt',
                      value === option.number && 'is-chosen',
                      value === option.number && checked !== null && `is-${checked}`,
                    )}
                    aria-pressed={value === option.number}
                    disabled={checked === 'right'}
                    onClick={() => {
                      setValue(option.number);
                      if (checked === 'wrong') {
                        setChecked(null);
                      }
                    }}
                  >
                    <span className="popt__no">{option.number}</span>
                    <span className="popt__text" dangerouslySetInnerHTML={{ __html: option.html }} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {checked === null ? null : (
            <div className={clsx('tverdict', `tverdict--${checked}`)} role="status">
              <p className="tverdict__title">
                <span className="tverdict__ico">
                  {checked === 'right' ? <RightIcon /> : <WrongIcon />}
                </span>
                {VERDICT[checked].title}
              </p>
              {/* Пояснение пришло вместе с заданием: при ошибке оно
                  говорит, что проверить, и ответа не выдаёт. В режиме
                  контроля пояснений нет до конца сессии. */}
              {control ? null : (
                <p
                  className="tverdict__text"
                  dangerouslySetInnerHTML={{
                    /* У задачи с вариантами пояснение своё у каждого
                       неверного варианта: оно говорит, что именно в
                       нём не так. */
                    __html: checked === 'right'
                      ? (task.options === null ? task.rightHint : '')
                      : (task.options === null ? task.wrongHint : (task.oshibki[value] ?? '')),
                  }}
                />
              )}
            </div>
          )}

          <div className="ttask__actions">
            {checked === 'right' ? (
              nextButton
            ) : (
              <>
                <Button onClick={check} disabled={!ready}>
                  Проверить
                </Button>
                {steps.length === 0 || control ? null : (
                  <span className="thint__offer">
                    <Button variant="ghost" onClick={openHint}>
                      Показать подсказку
                    </Button>
                    {/* Ученик видит цену подсказки до того, как её
                        откроет. */}
                    <span className="thint__warn">Задача не будет засчитана.</span>
                  </span>
                )}
                {task.solution === null || control ? null : (
                  <span className="thint__offer">
                    <Button variant="ghost" onClick={openSolution}>
                      Показать решение
                    </Button>
                    <span className="thint__warn">Задача не будет засчитана.</span>
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Разбор параболы и рисунок метода. Разбор открывается либо
          кнопкой до ответа — тогда задача не засчитана, — либо сам
          после верного ответа: там он уже ничего не стоит. Рисунок
          метода показывается вместе с разбором и только у этой
          подтемы. */}
      {task.solution !== null && !control && (solution || checked === 'right') ? (
        <div className="tsolution">
          <PrepSolution
            steps={task.solution}
            tip={task.method?.tip ?? ''}
            step={solutionStep}
            onStep={setSolutionStep}
            onClose={() => setSolution(false)}
          />
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
                  <p className="tmethod__title">{task.method.title}</p>
                </div>
              </div>
            </aside>
          )}
        </div>
      ) : null}

      {hint ? (
        <div className="thint">
          {steps.slice(0, step + 1).map((item, i) => {
            const done = i < step;
            return (
              <article key={i} className={clsx('tstep', done && 'is-done')}>
                <p className="tstep__no">
                  Шаг <b>{i + 1}</b> из {steps.length}
                </p>
                <h3 className="tstep__title" dangerouslySetInnerHTML={{ __html: item.titleHtml }} />
                <p className="tstep__text" dangerouslySetInnerHTML={{ __html: item.textHtml }} />

                <div
                  className={clsx(
                    'tstep__row',
                    item.shape === 'equation' && 'tstep__row--eq',
                    /* Уравнение двух прямых: четыре поля в строке,
                       им нужно больше места. */
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
                        state={
                          done ? 'success' : stepMark === 'wrong' ? 'error' : 'default'
                        }
                        inputMode="text"
                        autoComplete="off"
                        readOnly={done}
                        onChange={(event) => setFieldValue(i, fieldNo, event.target.value)}
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
                      disabled={item.fields.some((_, fieldNo) => fieldValue(i, fieldNo).trim() === '')}
                    >
                      Проверить
                    </Button>
                  )}
                </div>

                {/* Что проверить на шаге. Правильное значение
                    не показывается. */}
                {done || stepMark !== 'wrong' ? null : (
                  <p className="tstep__note" dangerouslySetInnerHTML={{ __html: item.wrongHint }} />
                )}
              </article>
            );
          })}

          {solvedByHint ? (
            <div className="tverdict tverdict--right" role="status">
              <p className="tverdict__title">
                <span className="tverdict__ico">
                  <RightIcon />
                </span>
                {VERDICT.right.title}
              </p>
              <p className="tverdict__text">Задача решена с подсказкой — она не засчитана.</p>
            </div>
          ) : null}

          {solvedByHint ? <div className="ttask__actions">{nextButton}</div> : null}
        </div>
      ) : null}
    </section>
  );
}
