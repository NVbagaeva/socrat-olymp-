'use client';

import Link from 'next/link';
import { useState } from 'react';
import { clsx } from 'clsx';
import { Button, FigureZoom, Input } from '@/components/ui';
import { OPORNYE_2 } from '@/content/vektory';
import { nextUnsolved, type TaskStatus } from '@/lib/prepOrder';
import { scrollTabTo } from '@/lib/tabScroll';
import { mikroById } from '@/lib/vektory/prep/bloki';
import { sluchaynyySeed } from '@/lib/vektory/prep/generate';
import { sealMikro, type MikroRazbor, type MikroSealed } from '@/lib/vektory/prep/seal';
import { mikroItog, mikroZapisat, opornye2 } from '@/lib/vektory/progress';
import { answerMatches, choiceMatches, openText } from '@/lib/vektory/secret';
import { HintIcon, RightIcon, WrongIcon } from '../prep/PrepIcons';

type Attempt = 'wrong' | 'skipped';

export interface Opornye2ScreenProps {
  blockId: string;
  title: string;
  /** Десять задач блока в закрытом виде, собраны на сборке. */
  tasks: (MikroSealed & { no: number })[];
  /** Плашка «Запомни»: формулы блока, свёрстаны. */
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

function razborIz(json: string): MikroRazbor | null {
  try {
    const value: unknown = JSON.parse(json);
    if (typeof value !== 'object' || value === null || !('stroki' in value)) {
      return null;
    }
    return value as MikroRazbor;
  } catch {
    return null;
  }
}

/**
 * Экран микрозадачи тренировок навыков №2.
 *
 * Как у подготовки №8: ответ сверяется с отпечатком, после ошибки
 * показывается формула, разбор закрыт и открывается по кнопке —
 * вместе с рисунком, на котором уже есть катеты. На рисунке условия
 * катетов нет. «Ещё вариант» собирает ту же задачу на новом seed
 * прямо в браузере.
 *
 * Исходы пишутся в хранилище раздела по действиям: верно, неверно,
 * открыл решение. Верное решение снимает прежний исход.
 */
export function Opornye2Screen({
  blockId,
  title,
  tasks,
  formulyHtml,
  listHref,
}: Opornye2ScreenProps) {
  const progress = opornye2.useProgress();
  const [attempts, setAttempts] = useState<Record<number, Attempt>>({});
  const [picked, setPicked] = useState<number | null>(null);
  const [value, setValue] = useState('');
  const [checked, setChecked] = useState<'right' | 'wrong' | null>(null);
  const [razbor, setRazbor] = useState<MikroRazbor | null>(null);
  const [memo, setMemo] = useState(false);
  /* Свежие варианты по номеру задачи: пока не просили — зафиксированный. */
  const [fresh, setFresh] = useState<Record<number, MikroSealed>>({});

  const status: TaskStatus[] = tasks.map((item) => {
    const itog = mikroItog(progress, blockId, item.no);
    if (itog === 'right') return 'right';
    if (itog !== null) return 'wrong';
    return attempts[item.no] ?? null;
  });
  const index = picked ?? firstOpen(status);
  const found = tasks[index];
  if (found === undefined) {
    return null;
  }
  const base = found;
  const task: MikroSealed = fresh[base.no] ?? base;
  const total = tasks.length;
  const nextOpen = nextUnsolved(status, index);
  const right = status.filter((item) => item === 'right').length;
  const wrong = status.filter((item) => item === 'wrong').length;
  const ready = value.trim() !== '';

  function reset() {
    setValue('');
    setChecked(null);
    setRazbor(null);
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
    const correct =
      task.answerType === 'choice'
        ? choiceMatches(value, task.seal)
        : answerMatches(value, task.seal);
    setPicked(index);
    setChecked(correct ? 'right' : 'wrong');
    mikroZapisat(blockId, base.no, correct ? 'right' : 'wrong');
    if (!correct) {
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
    const micro = mikroById(base.id);
    if (micro === undefined) {
      return;
    }
    setPicked(index);
    setFresh((prev) => ({ ...prev, [base.no]: sealMikro(micro, sluchaynyySeed()) }));
    reset();
  }

  function showSolution() {
    setRazbor(razborIz(openText(task.razbor, task.seal)));
    if (status[index] !== 'right') {
      mikroZapisat(blockId, base.no, 'revealed');
    }
  }

  return (
    <section className="ptask z2-ptask">
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
          {task.risunokSvg === null ? null : (
            /* Рисунок условия — без катетов: катеты только в разборе. */
            <FigureZoom className="chart ptask__chart z2-ptask__pic" label={OPORNYE_2.risunok}>
              <span className="vp-wrap" dangerouslySetInnerHTML={{ __html: task.risunokSvg }} />
            </FigureZoom>
          )}
        </div>
        {/* Подсказка — формула навыка. Появляется после ошибки или по
            кнопке «Формула»: ответа в ней нет. */}
        {checked === 'wrong' || memo ? (
          <aside className="ptask__hint">
            <p className="ptask__hint-head">
              <HintIcon />
              {OPORNYE_2.formula}
            </p>
            <div
              className="ptask__hint-text"
              dangerouslySetInnerHTML={{ __html: task.formulaHtml }}
            />
          </aside>
        ) : null}
      </article>

      <div className="ptask__answer">
        <p className="ptask__label" id="p2-answer-label">
          Ваш ответ:
        </p>

        {task.answerType === 'choice' && task.vybory !== null ? (
          <ul className="ptask__options" aria-labelledby="p2-answer-label">
            {task.vybory.map((option) => (
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
                  <span className="popt__text" dangerouslySetInnerHTML={{ __html: option.label }} />
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
            aria-labelledby="p2-answer-label"
            onChange={(event) => {
              setValue(event.target.value);
              if (checked === 'wrong') {
                setChecked(null);
              }
            }}
            readOnly={checked === 'right'}
          />
        )}

        {checked === null ? null : (
          <div className={clsx('pverdict', `pverdict--${checked}`)} role="status">
            <p className="pverdict__title">{VERDICT[checked].title}</p>
            <p className="pverdict__lead">{VERDICT[checked].lead}</p>
          </div>
        )}

        {razbor === null ? null : (
          <div className="z2-razbor" role="region" aria-label={OPORNYE_2.reshenie}>
            <p className="z2-razbor__title">{OPORNYE_2.reshenie}</p>
            <div className="z2-razbor__body">
              <div className="z2-razbor__lines">
                {razbor.stroki.map((line, i) => (
                  <p
                    className="z2-razbor__line"
                    key={i}
                    dangerouslySetInnerHTML={{ __html: line }}
                  />
                ))}
              </div>
              {razbor.risunokSvg === null ? null : (
                <FigureZoom className="z2-razbor__pic" label={OPORNYE_2.risunokRazbora}>
                  <span
                    className="vp-wrap"
                    dangerouslySetInnerHTML={{ __html: razbor.risunokSvg }}
                  />
                </FigureZoom>
              )}
            </div>
          </div>
        )}

        <div className="ptask__actions">
          {checked !== 'right' ? (
            <>
              <Button onClick={check} disabled={!ready}>
                Проверить
              </Button>
              <Button variant="ghost" onClick={() => setMemo(!memo)}>
                {memo ? 'Скрыть формулу' : OPORNYE_2.formula}
              </Button>
              {checked === 'wrong' ? (
                <Button variant="ghost" onClick={showSolution} disabled={razbor !== null}>
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
                  {OPORNYE_2.kListu}
                </Link>
              ) : (
                <Button onClick={() => open(nextOpen)}>
                  {nextOpen === index + 1 ? 'Следующее задание →' : 'Следующая нерешённая →'}
                </Button>
              )}
              <Button variant="ghost" onClick={showSolution} disabled={razbor !== null}>
                Показать решение
              </Button>
            </>
          )}
          <Button variant="ghost" onClick={another}>
            {OPORNYE_2.again}
          </Button>
        </div>
      </div>

      <aside className="z2-memo">
        <p className="z2-memo__title">{OPORNYE_2.zapomni}</p>
        <ul className="z2-memo__list">
          {formulyHtml.map((html, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: html }} />
          ))}
        </ul>
      </aside>
    </section>
  );
}
