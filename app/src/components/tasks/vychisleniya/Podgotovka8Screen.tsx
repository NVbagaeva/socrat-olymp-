'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { Button } from '@/components/ui';
import { BookmarkButton } from '@/components/zakladki/BookmarkButton';
import { formatHint, fractionRightHint } from '@/lib/otvet';
import { opornayaHref } from '@/lib/vychisleniya/links';
import { prep8Page } from '@/content/vychisleniya';
import { nextUnsolved, type TaskStatus } from '@/lib/prepOrder';
import { scrollTabTo } from '@/lib/tabScroll';
import { prepMicroById } from '@/lib/vychisleniya/prep/blocks';
import { sealPrep, type PrepSealed } from '@/lib/vychisleniya/prep/seal';
import { prep8IsSolved, prep8MarkSolved, usePrep8Progress } from '@/lib/vychisleniya/progress';
import { choiceMatches, openText, readSealed } from '@/lib/vychisleniya/secret';
import { randomSeed } from '@/lib/vychisleniya/session';
import { HintIcon, RightIcon, WrongIcon } from '../prep/PrepIcons';
import { AnswerInput, FormatHint } from '../otvet/AnswerInput';
import { Razbor8 } from './Razbor8';
import type { RazborHtml } from '@/lib/vychisleniya/razbor';

type Attempt = 'wrong' | 'skipped';

export interface Podgotovka8ScreenProps {
  blockId: string;
  /** Хвост адреса блока: по нему закладка открывает задачу. */
  slug: string;
  title: string;
  /** Десять задач блока в закрытом виде, собраны на сборке. */
  tasks: (PrepSealed & { no: number })[];
  /** Плашка «Запомни!»: формулы блока, свёрстаны. */
  formulyHtml: string[];
  listHref: string;
}

const VERDICT = {
  right: { title: 'Верно!', lead: 'Отлично! Переходим к следующему заданию.' },
  wrong: { title: 'Пока неверно', lead: 'Посмотрите формулу и попробуйте ещё раз.' },
};

function firstOpen(status: TaskStatus[]): number {
  const found = status.findIndex((item) => item === null || item === 'skipped');
  return found === -1 ? 0 : found;
}

/**
 * Экран микро-задачи блока подготовки №8.
 *
 * Ответ сверяется с отпечатком, после ошибки показывается точная
 * формула свойства, разбор закрыт и открывается по кнопке. «Ещё
 * вариант» собирает ту же задачу на новом seed прямо в браузере.
 */
export function Podgotovka8Screen({
  blockId,
  slug,
  title,
  tasks,
  formulyHtml,
  listHref,
}: Podgotovka8ScreenProps) {
  const progress = usePrep8Progress();
  const [attempts, setAttempts] = useState<Record<number, Attempt>>({});
  const [picked, setPicked] = useState<number | null>(null);
  const [value, setValue] = useState('');
  const [checked, setChecked] = useState<'right' | 'wrong' | null>(null);
  const [solution, setSolution] = useState<RazborHtml | null>(null);
  const [memo, setMemo] = useState(false);
  /* Свежие варианты по номеру задачи: пока не просили — зафиксированный. */
  const [fresh, setFresh] = useState<Record<number, PrepSealed>>({});
  /* Подсказка о записи ответа: не ошибка, попытка не тратится. */
  const [hint, setHint] = useState<string | null>(null);

  /* Из закладки: ?zadacha=<номер> открывает эту задачу блока. */
  useEffect(() => {
    const no = Number(new URLSearchParams(window.location.search).get('zadacha'));
    const at = tasks.findIndex((item) => item.no === no);
    if (at < 0) return undefined;
    /* После гидратации: разметка сборки одна для всех адресов блока. */
    const timer = window.setTimeout(() => {
      setPicked(at);
      scrollTabTo('.ptask__card');
    }, 0);
    return () => window.clearTimeout(timer);
  }, [tasks]);

  const status: TaskStatus[] = tasks.map((item) =>
    prep8IsSolved(progress, blockId, item.no) ? 'right' : (attempts[item.no] ?? null),
  );
  const index = picked ?? firstOpen(status);
  const found = tasks[index];
  if (found === undefined) {
    return null;
  }
  const base = found;
  const task: PrepSealed = fresh[base.no] ?? base;
  const total = tasks.length;
  const nextOpen = nextUnsolved(status, index);
  const right = status.filter((item) => item === 'right').length;
  const wrong = status.filter((item) => item === 'wrong').length;
  const ready = value.trim() !== '';

  function reset() {
    setValue('');
    setChecked(null);
    setSolution(null);
    setHint(null);
  }

  function open(next: number) {
    setPicked(next);
    reset();
    scrollTabTo('.ptask__card');
  }

  function check() {
    if (!ready) {
      return;
    }
    let correct: boolean;
    if (task.answerType === 'choice') {
      correct = choiceMatches(value, task.seal);
    } else {
      const reading = readSealed(value, task.seal, 'trenazher');
      if (reading.kind === 'format') {
        setHint(formatHint(reading.problem, reading.meant));
        return;
      }
      if (reading.kind === 'fractionRight') {
        setHint(fractionRightHint(reading.decimal));
        return;
      }
      correct = reading.right;
    }
    setHint(null);
    setPicked(index);
    setChecked(correct ? 'right' : 'wrong');
    if (correct) {
      prep8MarkSolved(blockId, base.no);
    } else {
      setAttempts((prev) => ({ ...prev, [base.no]: 'wrong' }));
    }
  }

  function skip() {
    setAttempts((prev) => ({ ...prev, [base.no]: 'skipped' }));
    if (nextOpen !== null) {
      open(nextOpen);
    }
  }

  function another() {
    const micro = prepMicroById(base.id);
    if (micro === undefined) {
      return;
    }
    setPicked(index);
    setFresh((prev) => ({ ...prev, [base.no]: sealPrep(micro, randomSeed()) }));
    reset();
  }

  function showSolution() {
    try {
      setSolution(JSON.parse(openText(task.razbor, task.seal)) as RazborHtml);
    } catch {
      setSolution({ shagi: [], delimost: [] });
    }
  }

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
        Задание <b>{base.no}</b> из {total} · {task.nazvanie}
      </p>

      <ol className="ptask__dots">
        {tasks.map((item, i) => {
          const state = status[i] ?? null;
          return (
            <li key={item.id}>
              <button
                type="button"
                className={clsx(
                  'pdot',
                  state !== null && `is-${state}`,
                  i === index && 'is-current',
                )}
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
          <div className="ptask__question" dangerouslySetInnerHTML={{ __html: task.uslovieHtml }} />
        </div>
        <div className="z8-task__tools">
          <BookmarkButton
            section="8"
            place="opornye"
            refId={`${slug}#${base.no}`}
            title={`№8 · Опорные задачи: ${title}, задача ${base.no}`}
            href={opornayaHref(slug, base.no)}
          />
        </div>
        {/* Подсказка — точная формула свойства. Появляется после ошибки
            или по кнопке «Формула»: ответа в ней нет. */}
        {checked === 'wrong' || memo ? (
          <aside className="ptask__hint">
            <p className="ptask__hint-head">
              <HintIcon />
              Формула
            </p>
            <div
              className="ptask__hint-text"
              dangerouslySetInnerHTML={{ __html: task.formulaHtml }}
            />
          </aside>
        ) : null}
      </article>

      <div className="ptask__answer">
        <p className="ptask__label" id="p8-answer-label">
          Ваш ответ:
        </p>

        {task.answerType === 'choice' && task.choices !== null ? (
          <ul className="ptask__options" aria-labelledby="p8-answer-label">
            {task.choices.map((option) => (
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
                    if (checked !== 'right') {
                      setValue(option.number);
                      setChecked(null);
                    }
                  }}
                >
                  <span className="popt__no">{option.number}</span>
                  <span className="popt__text">{option.label}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <form
            className="z8-answer"
            onSubmit={(event) => {
              event.preventDefault();
              if (checked !== 'right') check();
            }}
          >
            <AnswerInput
              className="ptask__input"
              value={value}
              state={checked === null ? 'default' : checked === 'right' ? 'success' : 'error'}
              aria-labelledby="p8-answer-label"
              onChange={(next) => {
                setValue(next);
                setHint(null);
                if (checked === 'wrong') {
                  setChecked(null);
                }
              }}
              readOnly={checked === 'right'}
            />
          </form>
        )}
        {hint === null ? null : <FormatHint text={hint} />}

        {checked === null ? null : (
          <div className={clsx('pverdict', `pverdict--${checked}`)} role="status">
            <p className="pverdict__title">{VERDICT[checked].title}</p>
            <p className="pverdict__lead">{VERDICT[checked].lead}</p>
          </div>
        )}

        {solution === null ? null : <Razbor8 razbor={solution} />}

        <div className="ptask__actions">
          {checked !== 'right' ? (
            <>
              <Button onClick={check} disabled={!ready}>
                Проверить
              </Button>
              <Button variant="ghost" onClick={() => setMemo(!memo)}>
                {memo ? 'Скрыть формулу' : 'Формула'}
              </Button>
              {checked === 'wrong' ? (
                <Button variant="ghost" onClick={showSolution} disabled={solution !== null}>
                  Показать решение
                </Button>
              ) : (
                <Button variant="ghost" onClick={skip}>
                  Пропустить задание
                </Button>
              )}
            </>
          ) : (
            <>
              {nextOpen === null ? (
                <Link className="btn btn--primary" href={listHref}>
                  К списку блоков →
                </Link>
              ) : (
                <Button onClick={() => open(nextOpen)}>
                  {nextOpen === index + 1 ? 'Следующее задание →' : 'Следующая нерешённая →'}
                </Button>
              )}
              <Button variant="ghost" onClick={showSolution} disabled={solution !== null}>
                Показать решение
              </Button>
            </>
          )}
          <Button variant="ghost" onClick={another}>
            {prep8Page.again}
          </Button>
        </div>
      </div>

      <aside className="z8-memo">
        <p className="z8-memo__title">Запомни</p>
        <ul className="z8-memo__list">
          {formulyHtml.map((html, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: html }} />
          ))}
        </ul>
      </aside>
    </section>
  );
}
