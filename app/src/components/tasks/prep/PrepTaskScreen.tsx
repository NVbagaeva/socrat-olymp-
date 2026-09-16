'use client';

import Link from 'next/link';
import { useState } from 'react';
import { clsx } from 'clsx';
import { Button, Input } from '@/components/ui';
import { sameNumber } from '@/lib/answer';
import type { PrepTask } from '@/lib/prep';
import { HintIcon, RightIcon, WrongIcon } from './PrepIcons';
import { PrepSolution } from './PrepSolution';

/** Как закончилась работа над задачей. Пусто — ещё не бралась. */
type Status = 'right' | 'wrong' | 'skipped' | null;

export interface PrepTaskScreenProps {
  /** Название навыка: заголовок экрана. */
  title: string;
  /** Десять задач навыка, собранные на сборке. */
  tasks: PrepTask[];
  /** Адрес списка навыков: туда ведёт кнопка с последней задачи. */
  listHref: string;
  /** Приём навыка для плашки «Запомни!» в разборе. */
  tip: string;
  /**
   * Сколько задач навыка уже решено — витринное число из demo.ts,
   * то же самое, что стоит на карточке навыка. С него экран
   * начинает и к нему возвращается после перезагрузки страницы.
   */
  solved: number;
}

const VERDICT = {
  right: {
    title: 'Верно!',
    lead: 'Отлично! Переходим к следующему заданию.',
  },
  wrong: {
    /* Формулировка дословная: не «Ошибка» и не «Неправильно». */
    title: 'Пока неверно',
    lead: 'Попробуйте ещё раз или посмотрите разбор решения.',
  },
};

/**
 * Экран задачи навыка.
 *
 * Все десять задач приходят готовыми пропсами и живут на одном
 * экране: смена задачи — это состояние, а не переход по адресу.
 * Иначе счётчики верных и неверных обнулялись бы на каждой задаче —
 * хранить их между страницами нечем, localStorage в этой вкладке
 * мы не используем.
 *
 * Состояние не переживает перезагрузку страницы, и это осознанно:
 * настоящего прогресса в проекте пока нет.
 */
export function PrepTaskScreen({ title, tasks, listHref, tip, solved }: PrepTaskScreenProps) {
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState<Status[]>(() =>
    tasks.map((_, i) => (i < solved ? 'right' : null)),
  );
  const [value, setValue] = useState('');
  const [checked, setChecked] = useState<'right' | 'wrong' | null>(null);
  /* Разбор: раскрыт ли он и какой шаг открыт. */
  const [solution, setSolution] = useState(false);
  const [step, setStep] = useState(0);

  const task = tasks[index];
  if (task === undefined) {
    /* Набор пуст — показывать нечего. В данных такого не бывает, но
       обращение по индексу в TypeScript честно необязательно. */
    return null;
  }

  const total = tasks.length;
  const last = index === total - 1;
  const right = status.filter((item) => item === 'right').length;
  const wrong = status.filter((item) => item === 'wrong').length;
  const ready = value.trim() !== '';

  /* Счётчики считаются из тех же значений, что красят кружки:
     разойтись им не на чем. */
  function mark(next: Status) {
    setStatus((prev) => prev.map((item, i) => (i === index ? next : item)));
  }

  function open(next: number) {
    setIndex(next);
    setValue('');
    setChecked(null);
    setSolution(false);
    setStep(0);
  }

  function check() {
    if (!ready) {
      return;
    }
    /* У задач с выбором ответ движка — номер варианта, у остальных
       число. Поэтому сверка разная: номер сравнивается как есть,
       число — как число. */
    const correct =
      task.answerType === 'choice' ? value === task.answer : sameNumber(value, task.answer);
    setChecked(correct ? 'right' : 'wrong');
    mark(correct ? 'right' : 'wrong');
  }

  function skip() {
    mark('skipped');
    if (!last) {
      open(index + 1);
    }
  }

  function retry() {
    setValue('');
    setChecked(null);
    setSolution(false);
    setStep(0);
  }

  function showSolution() {
    setSolution(true);
    setStep(0);
  }

  /* Причина показывается только у того варианта, который выбрал
     ученик: подсвечивать чужие ошибки и тем более верный ответ
     до проверки нельзя. */
  const chosen = task.options?.find((option) => option.number === value) ?? null;
  const reason = checked === 'wrong' && chosen?.error ? chosen.error : null;

  return (
    <section className="ptask">
      <header className="ptask__head">
        <h2 className="ptask__title">{title}</h2>
        <p className="ptask__score">
          <span className="ptask__score-item ptask__score-item--right">
            <RightIcon />
            <span className="ptask__score-num">{right}</span>
            <span className="sr-only">верных</span>
          </span>
          <span className="ptask__score-item ptask__score-item--wrong">
            <WrongIcon />
            <span className="ptask__score-num">{wrong}</span>
            <span className="sr-only">неверных</span>
          </span>
        </p>
      </header>

      <p className="ptask__counter">
        Задание <b>{task.no}</b> из {total}
      </p>

      {/* Ряд задач: столько кружков, сколько задач в наборе. */}
      <ol className="ptask__dots">
        {tasks.map((item, i) => {
          const state = status[i] ?? null;
          return (
            <li key={item.id}>
              <button
                type="button"
                className={clsx('pdot', state !== null && `is-${state}`, i === index && 'is-current')}
                aria-current={i === index ? 'true' : undefined}
                onClick={() => open(i)}
              >
                {item.no}
                <span className="sr-only">
                  {state === 'right' ? ' — решено верно' : null}
                  {state === 'wrong' ? ' — решено неверно' : null}
                  {state === 'skipped' ? ' — пропущено' : null}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <article className="ptask__card">
        <div className="ptask__text">
          {/* Разметка своя: условие собрал движок, формулы набрал
              KaTeX — обе на сборке. */}
          <div
            className="ptask__question"
            dangerouslySetInnerHTML={{ __html: task.questionHtml }}
          />
          {task.chartSvg === null ? null : (
            <span
              className="chart ptask__chart"
              dangerouslySetInnerHTML={{ __html: task.chartSvg }}
            />
          )}
        </div>

        {task.hintHtml === null ? null : (
          <aside className="ptask__hint">
            <p className="ptask__hint-head">
              <HintIcon />
              Подсказка
            </p>
            <div className="ptask__hint-text" dangerouslySetInnerHTML={{ __html: task.hintHtml }} />
          </aside>
        )}
      </article>

      <div className="ptask__answer">
        <p className="ptask__label" id="ptask-answer-label">
          Ваш ответ:
        </p>

        {task.answerType === 'choice' && task.options !== null ? (
          <ul className="ptask__options" aria-labelledby="ptask-answer-label">
            {task.options.map((option) => (
              <li key={option.number}>
                <button
                  type="button"
                  className={clsx(
                    'popt',
                    value === option.number && 'is-chosen',
                    value === option.number && checked !== null && `is-${checked}`,
                  )}
                  aria-pressed={value === option.number}
                  onClick={() => {
                    if (checked === null) {
                      setValue(option.number);
                    }
                  }}
                >
                  <span className="popt__no">{option.number}</span>
                  <span
                    className="popt__text"
                    dangerouslySetInnerHTML={{ __html: option.html }}
                  />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <Input
            className="ptask__input"
            value={value}
            state={checked === null ? 'default' : checked === 'right' ? 'success' : 'error'}
            inputMode="text"
            autoComplete="off"
            aria-labelledby="ptask-answer-label"
            onChange={(event) => setValue(event.target.value)}
            readOnly={checked === 'right'}
          />
        )}

        {checked === null ? null : (
          <div className={clsx('pverdict', `pverdict--${checked}`)} role="status">
            <p className="pverdict__title">{VERDICT[checked].title}</p>
            <p className="pverdict__lead">{VERDICT[checked].lead}</p>
            {reason === null ? null : <p className="pverdict__reason">{reason}</p>}
          </div>
        )}

        <div className="ptask__actions">
          {checked === null ? (
            <>
              <Button onClick={check} disabled={!ready}>
                Проверить
              </Button>
              <Button variant="ghost" onClick={skip}>
                Пропустить задание
              </Button>
            </>
          ) : null}

          {checked === 'right' ? (
            <>
              {last ? (
                <Link className="btn btn--primary" href={listHref}>
                  К списку навыков →
                </Link>
              ) : (
                <Button onClick={() => open(index + 1)}>Следующее задание →</Button>
              )}
              <Button variant="ghost" onClick={showSolution} disabled={solution}>
                Разобрать решение
              </Button>
            </>
          ) : null}

          {checked === 'wrong' ? (
            <>
              <Button onClick={showSolution} disabled={solution}>
                Разобрать решение →
              </Button>
              <Button variant="ghost" onClick={retry}>
                Попробовать ещё раз
              </Button>
            </>
          ) : null}
        </div>
      </div>

      {solution ? (
        <PrepSolution
          steps={task.steps}
          tip={tip}
          step={step}
          onStep={setStep}
          onClose={() => setSolution(false)}
        />
      ) : null}
    </section>
  );
}
