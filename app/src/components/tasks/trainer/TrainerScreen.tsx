'use client';

import { Fragment, useCallback, useMemo, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { Button, FigureZoom, Input } from '@/components/ui';
import { parseAnswer, sameNumber } from '@/lib/answer';
import type { TrainerPart, TrainerQuestion, TrainerStep, TrainerTask } from '@/lib/trainer';
import { trainerKindTitle } from '@/content/trainerModes';
import { recordAttempt } from '@/lib/trainerProgress';
import { pickRound, useRound } from '@/lib/trainerRound';
import { RightIcon, WrongIcon } from '../prep/PrepIcons';
import { PrepSolution } from '../prep/PrepSolution';
import { useSessionReport } from '../session/useSessionReport';
import type { TaskMark } from '@/lib/trainerSession/types';
import type { TrainerUi } from './trainerUi';

export interface TrainerScreenProps {
  /** Все задания сессии: подход раскладывается из них в браузере. */
  pool: TrainerTask[];
  /** Под каким именем помнить подход: у каждой сессии свой. */
  roundKey: string;
  /** Состояние экрана из сохранённой тренировки. null — тренировка новая. */
  restored: TrainerUi | null;
  /** Сообщить оболочке сессии о новом состоянии (она его сохранит). */
  report: (ui: TrainerUi) => void;
  /** Активное время тренировки, мс: пауза и скрытая вкладка не идут. */
  elapsed: () => number;
  /** Последнее задание решено: показать итоги. */
  onFinish: () => void;
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
  restored,
  report,
  elapsed,
  onFinish,
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
  const order = useRound(roundKey, build, restored?.order);
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

  /* Всё, что ученик успел сделать, приходит из сохранённой тренировки:
     вернувшись в тренажёр, он продолжает с того же места. */
  const [index, setIndex] = useState(restored?.index ?? 0);
  const [value, setValue] = useState(restored?.value ?? '');
  const [checked, setChecked] = useState<'right' | 'wrong' | null>(restored?.checked ?? null);
  /* Чем закончилось каждое задание подхода: полоса берёт вид оттуда. */
  const [marks, setMarks] = useState<Record<number, TaskMark>>(restored?.marks ?? {});
  /* Задания, в которых была ошибка: на итогах они отличаются от пропущенных. */
  const [tried, setTried] = useState<Record<number, true>>(restored?.tried ?? {});

  /* Подсказка: открыта ли она, какой шаг идёт, что набрано в полях
     и как проверился текущий шаг. */
  const [hint, setHint] = useState(restored?.hint ?? false);
  /* Разбор параболы: у неё нет цепочки шагов с полями, зато есть
     тот же разбор, что во вкладке опорных задач. */
  const [solution, setSolution] = useState(restored?.solution ?? false);
  const [solutionStep, setSolutionStep] = useState(restored?.solutionStep ?? 0);
  const [step, setStep] = useState(restored?.step ?? 0);
  const [fields, setFields] = useState<Record<string, string>>(restored?.fields ?? {});
  const [stepMark, setStepMark] = useState<'right' | 'wrong' | null>(restored?.stepMark ?? null);
  /* Шаг с вопросами (гипербола): сколько вопросов шага уже пройдено
     и какой неверный вариант выбран на текущем — под ним пояснение. */
  const [answered, setAnswered] = useState(restored?.answered ?? 0);
  const [picked, setPicked] = useState<number | null>(restored?.picked ?? null);
  /* Отдельное предупреждение к неверным полям части (парабола): точка,
     дающая тождество, или неверный знак. null — общий текст шага. */
  const [note, setNote] = useState<string | null>(restored?.note ?? null);

  /* Сколько раз ответ не сошёлся. Время тренировки считает оболочка
     сессии (только активное: пауза и скрытая вкладка не в счёт); здесь
     остаётся время на одно задание — от первой проверки, пока ученик
     читает условие, оно не идёт. */
  const [misses, setMisses] = useState(restored?.misses ?? 0);
  const taskStartedAt = useRef<number | null>(restored?.taskFrom ?? null);
  /* Была ли ошибка в текущем задании: начисто пройденное уходит
     из списка ошибочных, остальное в нём остаётся. */
  const failed = useRef(restored?.failed ?? false);

  function startClock() {
    if (taskStartedAt.current === null) {
      taskStartedAt.current = elapsed();
    }
  }

  /** Сколько секунд ушло на текущее задание. */
  function taskSeconds(): number {
    const from = taskStartedAt.current;
    return from === null ? 0 : (elapsed() - from) / 1000;
  }

  /* Неверный ответ — в поле, в шаге подсказки или в вопросе шага. */
  function miss() {
    failed.current = true;
    setMisses(misses + 1);
    setTried({ ...tried, [index]: true });
  }

  /* Закрытое задание уходит в хранилище: счётчики вкладки считаются
     оттуда и обновляются сразу, без перезагрузки. */
  function remember(item: TrainerTask, right: boolean, clean: boolean) {
    recordAttempt({ kind: item.kind, taskId: item.id, right, clean, seconds: taskSeconds() });
  }

  /* Всё состояние экрана — оболочке сессии: она сохраняет его при
     каждом изменении, а при возвращении отдаёт обратно (restored). */
  useSessionReport<TrainerUi>(report, {
    index,
    marks,
    tried,
    order: order.length === 0 ? null : order,
    value,
    checked,
    hint,
    solution,
    solutionStep,
    step,
    fields,
    stepMark,
    answered,
    picked,
    note,
    misses,
    failed: failed.current,
    taskFrom: taskStartedAt.current,
  });

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
    } else {
      miss();
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
  }

  function openHint() {
    setHint(true);
    setChecked(null);
    setStep(0);
    setStepMark(null);
    setFields({});
    setAnswered(0);
    setPicked(null);
    setNote(null);
  }

  function checkStep() {
    if (current === undefined) {
      return;
    }
    startClock();
    /* Верно по ключу шага или по любому другому верному набору —
       например, по координатам другой отмеченной точки. */
    const sets = [current.fields.map((field) => field.answer), ...(current.variants ?? [])];
    const right = sets.some((answers) =>
      answers.every((answer, fieldNo) => sameNumber(fieldValue(step, fieldNo), answer)),
    );
    if (!right) {
      setStepMark('wrong');
      miss();
      return;
    }
    advance();
  }

  /* Вариант ответа на вопрос шага. Неверный — пояснение и выбор ещё
     раз; верный — вывод, следующий вопрос или следующий шаг. */
  function pickOption(optionNo: number) {
    const question = current?.questions?.[answered];
    if (question === undefined) {
      return;
    }
    startClock();
    if (question.options[optionNo]?.right !== true) {
      setPicked(optionNo);
      miss();
      return;
    }
    setPicked(null);
    if (answered + 1 < (current?.questions?.length ?? 0)) {
      setAnswered(answered + 1);
      return;
    }
    advance();
  }

  /* Шаг из частей (парабола): поля текущей части. Неверно — общий
     текст, а для ловушки или неверного знака — своё предупреждение. */
  function partFieldValue(stepNo: number, partNo: number, fieldNo: number): string {
    return fields[`${stepNo}:${partNo}:${fieldNo}`] ?? '';
  }

  function setPartFieldValue(stepNo: number, partNo: number, fieldNo: number, next: string) {
    setFields({ ...fields, [`${stepNo}:${partNo}:${fieldNo}`]: next });
    if (stepMark === 'wrong') {
      setStepMark(null);
      setNote(null);
    }
  }

  function nextPart() {
    setStepMark(null);
    setPicked(null);
    setNote(null);
    if (answered + 1 < (current?.parts?.length ?? 0)) {
      setAnswered(answered + 1);
      return;
    }
    advance();
  }

  function checkPart() {
    const part = current?.parts?.[answered];
    if (part === undefined || part.kind !== 'fields') {
      return;
    }
    startClock();
    const values = part.fields.map((_, fieldNo) => partFieldValue(step, answered, fieldNo));
    const sets = [part.fields.map((field) => field.answer), ...(part.variants ?? [])];
    const right = sets.some((answers) =>
      answers.every((answer, fieldNo) => sameNumber(values[fieldNo] ?? '', answer)),
    );
    if (right) {
      nextPart();
      return;
    }
    miss();
    setStepMark('wrong');
    const trap = (part.traps ?? []).find((item) =>
      item.values.every((value, fieldNo) => sameNumber(values[fieldNo] ?? '', value)),
    );
    if (trap !== undefined) {
      setNote(trap.whyHtml);
      return;
    }
    if (part.sign !== undefined) {
      const typed = parseAnswer(values[part.sign.field] ?? '');
      const want = parseAnswer(part.fields[part.sign.field]?.answer ?? '');
      if (typed !== null && want !== null && typed * want < 0) {
        setNote(part.sign.whyHtml);
        return;
      }
    }
    setNote(null);
  }

  function pickPart(optionNo: number) {
    const part = current?.parts?.[answered];
    if (part === undefined || part.kind !== 'choice') {
      return;
    }
    startClock();
    if (part.options[optionNo]?.right !== true) {
      setPicked(optionNo);
      miss();
      return;
    }
    nextPart();
  }

  /* Шаг пройден: следующий, а после последнего — задача решена. */
  function advance() {
    setStepMark(null);
    setAnswered(0);
    setPicked(null);
    setNote(null);
    setStep(step + 1);
    if (step + 1 >= steps.length) {
      /* Задача пройдена по шагам: в верных она не числится. */
      setMarks({ ...marks, [index]: 'hinted' });
      remember(task, false, false);
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
    setAnswered(0);
    setPicked(null);
    setNote(null);
  }

  const nextButton = last ? (
    <Button onClick={onFinish}>Смотреть результат →</Button>
  ) : (
    <Button onClick={next}>Следующее задание →</Button>
  );

  return (
    <section className="ttask">
      {/* Номер задания, решённое и время показывает панель тренировки
          над экраном (components/tasks/session). */}
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
              {/* Шаг о сдвиге подсвечивает свою асимптоту. */}
              <span
                data-focus={(hint && current?.focus) || undefined}
                dangerouslySetInnerHTML={{
                  __html:
                    hint &&
                    current?.chartSvg !== undefined &&
                    answered >= (current.chartFrom ?? 0)
                      ? current.chartSvg
                      : task.chartSvg,
                }}
              />
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
                  {/* Название набрано KaTeX вместе с заданием (lib/trainerMethod.ts). */}
                  <p
                    className="tmethod__title"
                    dangerouslySetInnerHTML={{ __html: task.method.title }}
                  />
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
                    current={done ? item.parts.length : answered}
                    picked={done ? null : picked}
                    mark={done ? null : stepMark}
                    note={note}
                    value={partFieldValue}
                    onChange={setPartFieldValue}
                    onPick={pickPart}
                    onCheck={checkPart}
                  />
                )}

                {item.questions === undefined ? null : (
                  <Questions
                    questions={item.questions}
                    answered={done ? item.questions.length : answered}
                    picked={done ? null : picked}
                    onPick={pickOption}
                  />
                )}

                {item.questions !== undefined || item.parts !== undefined ? null : (
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

                )}

                {/* Что проверить на шаге. Правильное значение
                    не показывается. */}
                {done || stepMark !== 'wrong' ? null : (
                  <p className="tstep__note" dangerouslySetInnerHTML={{ __html: item.wrongHint }} />
                )}
                {/* Шаг пройден — подстановка и вычисление из полного решения. */}
                {done && item.afterHtml !== undefined ? (
                  <p className="tstep__after" dangerouslySetInnerHTML={{ __html: item.afterHtml }} />
                ) : null}
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

/* Вопросы шага по очереди: пройденные — с отмеченным верным вариантом
   и выводом, текущий — кнопками. Неверный выбор подсвечен, под
   кнопками — почему нет. */
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
        if (questionNo >= questions.length) {
          return null;
        }
        const passed = questionNo < answered;
        const wrong = !passed && picked !== null ? (question.options[picked] ?? null) : null;
        return (
          <div key={questionNo} className="tquest">
            <p className="tquest__prompt" dangerouslySetInnerHTML={{ __html: question.promptHtml }} />
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
              <p className="tstep__note" role="status" dangerouslySetInnerHTML={{ __html: wrong.whyHtml }} />
            )}
            {passed ? (
              <p className="tquest__right" dangerouslySetInnerHTML={{ __html: question.rightHtml }} />
            ) : null}
          </div>
        );
      })}
    </>
  );
}

/* Шаг из частей по очереди: пройденные — с отмеченным ответом и
   выводом, текущая — кнопками или полями. */
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
                <p className="tstep__note" role="status" dangerouslySetInnerHTML={{ __html: wrong.whyHtml }} />
              )}
              {passed ? (
                <p className="tquest__right" dangerouslySetInnerHTML={{ __html: part.rightHtml }} />
              ) : null}
            </div>
          );
        }
        const empty = part.fields.some((_, fieldNo) => value(stepNo, partNo, fieldNo).trim() === '');
        return (
          <div key={partNo} className="tquest">
            {part.textHtml === '' ? null : (
              <p className="tquest__prompt" dangerouslySetInnerHTML={{ __html: part.textHtml }} />
            )}
            <div className={clsx('tstep__row', part.fields.length > 2 && 'tstep__row--wide')}>
              {part.fields.map((field, fieldNo) => (
                <Fragment key={fieldNo}>
                  <span className="tstep__label" dangerouslySetInnerHTML={{ __html: field.labelHtml }} />
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
