'use client';

import { Fragment, useState } from 'react';
import { clsx } from 'clsx';
import { Button, Input } from '@/components/ui';
import { sameNumber } from '@/lib/answer';
import type { TrainerStep, TrainerTask } from '@/lib/trainer';
import { RightIcon, WrongIcon } from '../prep/PrepIcons';

export interface TrainerScreenProps {
  /** Десять заданий подхода, собранные на сборке. */
  tasks: TrainerTask[];
}

/* Обе плашки обратной связи: заголовки дословные, без «Неверно». */
const VERDICT = {
  right: { title: 'Верно!' },
  wrong: { title: 'Есть ошибка' },
};

/** Чем закончилось задание: само или с подсказкой. */
type Mark = 'right' | 'hinted';

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
export function TrainerScreen({ tasks }: TrainerScreenProps) {
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState('');
  const [checked, setChecked] = useState<'right' | 'wrong' | null>(null);
  /* Чем закончилось каждое задание подхода: полоса берёт вид оттуда. */
  const [marks, setMarks] = useState<Record<number, Mark>>({});

  /* Подсказка: открыта ли она, какой шаг идёт, что набрано в полях
     и как проверился текущий шаг. */
  const [hint, setHint] = useState(false);
  const [step, setStep] = useState(0);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [stepMark, setStepMark] = useState<'right' | 'wrong' | null>(null);

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
    const right = sameNumber(value, task.answer);
    setChecked(right ? 'right' : 'wrong');
    if (right) {
      setMarks({ ...marks, [index]: 'right' });
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
    const right = current.fields.every((field, fieldNo) =>
      sameNumber(fieldValue(step, fieldNo), field.answer),
    );
    if (!right) {
      setStepMark('wrong');
      return;
    }
    setStepMark(null);
    setStep(step + 1);
    if (step + 1 >= steps.length) {
      /* Задача пройдена по шагам: в верных она не числится. */
      setMarks({ ...marks, [index]: 'hinted' });
    }
  }

  function next() {
    setIndex(index + 1);
    setValue('');
    setChecked(null);
    setHint(false);
    setStep(0);
    setFields({});
    setStepMark(null);
  }

  const nextButton = last ? null : <Button onClick={next}>Следующее задание →</Button>;

  return (
    <section className="ttask">
      <p className="ttask__count">
        Задание <b>{task.no}</b> из {total}
      </p>

      {/* Полоса подхода: решённое залито зелёным, пройденное
          с подсказкой — светло-синим, текущее подсвечено. */}
      <ol className="ttask__bar" aria-hidden="true">
        {tasks.map((item, i) => (
          <li
            key={item.id}
            className={clsx(
              'ttask__dot',
              marks[i] === 'right' && 'is-done',
              marks[i] === 'hinted' && 'is-hinted',
              i === index && 'is-current',
            )}
          />
        ))}
      </ol>

      <article className="ptask__card">
        <div className="ptask__text">
          {/* Условие собрал движок, формулы набрал KaTeX — обе
              на сборке. */}
          <div className="ptask__question" dangerouslySetInnerHTML={{ __html: task.questionHtml }} />
          {task.chartSvg === null ? null : (
            <span className="chart ptask__chart" dangerouslySetInnerHTML={{ __html: task.chartSvg }} />
          )}
        </div>
      </article>

      {hint ? null : (
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
                <span className="tverdict__ico">
                  {checked === 'right' ? <RightIcon /> : <WrongIcon />}
                </span>
                {VERDICT[checked].title}
              </p>
              {/* Пояснение пришло вместе с заданием: при ошибке оно
                  говорит, что проверить, и ответа не выдаёт. */}
              <p
                className="tverdict__text"
                dangerouslySetInnerHTML={{
                  __html: checked === 'right' ? task.rightHint : task.wrongHint,
                }}
              />
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
                {steps.length === 0 ? null : (
                  <span className="thint__offer">
                    <Button variant="ghost" onClick={openHint}>
                      Показать подсказку
                    </Button>
                    {/* Ученик видит цену подсказки до того, как её
                        откроет. */}
                    <span className="thint__warn">Задача не будет засчитана.</span>
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      )}

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

                <div className={clsx('tstep__row', item.shape === 'equation' && 'tstep__row--eq')}>
                  {item.fields.map((field, fieldNo) => (
                    <Fragment key={fieldNo}>
                      <span
                        className="tstep__label"
                        dangerouslySetInnerHTML={{ __html: field.labelHtml }}
                      />
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
