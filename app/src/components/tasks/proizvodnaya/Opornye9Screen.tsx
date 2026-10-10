'use client';

import Link from 'next/link';
import { useState } from 'react';
import { clsx } from 'clsx';
import { Button, Input } from '@/components/ui';
import { OPORNYE_9 } from '@/content/proizvodnaya';
import { nextUnsolved, type TaskStatus } from '@/lib/prepOrder';
import { prepMicroById } from '@/lib/proizvodnaya/prep/blocks';
import { prep9IsSolved, prep9MarkSolved, usePrep9Progress } from '@/lib/proizvodnaya/prepProgress';
import { sealPrep, type PrepSealed, type PrepZakryto } from '@/lib/proizvodnaya/prep/seal';
import { answerMatches, choiceMatches, openText } from '@/lib/proizvodnaya/secret';
import { randomSeed } from '@/lib/vychisleniya/session';
import { scrollTabTo } from '@/lib/tabScroll';
import { HintIcon, RightIcon, WrongIcon } from '../prep/PrepIcons';
import { FiguraSvg9 } from './FiguraSvg9';

type Attempt = 'wrong' | 'skipped';

export interface Opornye9ScreenProps {
  blockId: string;
  title: string;
  /** Десять задач блока в закрытом виде, собраны на сборке. */
  tasks: (PrepSealed & { no: number })[];
  /** Плашка «Запомни»: формулы блока, свёрстаны. */
  zapomniHtml: string[];
  listHref: string;
}

const VERDICT = {
  right: { title: 'Верно!', lead: 'Отлично! Переходим к следующему заданию.' },
  wrong: { title: 'Пока неверно', lead: 'Откройте подсказку и попробуйте ещё раз.' },
};

function firstOpen(status: TaskStatus[]): number {
  const found = status.findIndex((item) => item === null || item === 'skipped');
  return found === -1 ? 0 : found;
}

function zakrytoIz(task: PrepSealed): PrepZakryto | null {
  try {
    return JSON.parse(openText(task.zakryto, task.seal)) as PrepZakryto;
  } catch {
    return null;
  }
}

/** Состояние лесенки: номер текущего вопроса и неверный выбор на нём. */
interface Lesenka {
  q: number;
  wrong: number | null;
}

/**
 * Экран микрозадачи опорного блока №9: условие с рисунком (без
 * построений), ответ числом или кнопками, плашка «Запомни», подсказка
 * лесенкой вопросов и закрытое решение. «Ещё вариант» собирает ту же
 * микрозадачу на новом seed в браузере. Верный ответ лежит только в
 * отпечатке; подсказка и разбор раскрываются им же.
 */
export function Opornye9Screen({
  blockId,
  title,
  tasks,
  zapomniHtml,
  listHref,
}: Opornye9ScreenProps) {
  const progress = usePrep9Progress();
  const [attempts, setAttempts] = useState<Record<number, Attempt>>({});
  const [picked, setPicked] = useState<number | null>(null);
  const [value, setValue] = useState('');
  const [checked, setChecked] = useState<'right' | 'wrong' | null>(null);
  const [zakryto, setZakryto] = useState<PrepZakryto | null>(null);
  const [podskazka, setPodskazka] = useState(false);
  const [razbor, setRazbor] = useState(false);
  const [lesenka, setLesenka] = useState<Lesenka>({ q: 0, wrong: null });
  /* Свежие варианты по номеру задачи: пока не просили — зафиксированный. */
  const [fresh, setFresh] = useState<Record<number, PrepSealed>>({});

  const status: TaskStatus[] = tasks.map((item) =>
    prep9IsSolved(progress, blockId, item.no) ? 'right' : (attempts[item.no] ?? null),
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
    setZakryto(null);
    setPodskazka(false);
    setRazbor(false);
    setLesenka({ q: 0, wrong: null });
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
    if (correct) {
      prep9MarkSolved(blockId, base.no);
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
    try {
      /* Сломанный seed не должен ронять экран. */
      setFresh((prev) => ({ ...prev, [base.no]: sealPrep(micro, randomSeed()) }));
    } catch {
      /* Остаёмся на прежнем варианте. */
    }
    reset();
  }

  function otkryt(): PrepZakryto | null {
    const data = zakryto ?? zakrytoIz(task);
    setZakryto(data);
    return data;
  }

  function togglePodskazka() {
    if (!podskazka) {
      otkryt();
    }
    setPodskazka(!podskazka);
  }

  function showSolution() {
    otkryt();
    setRazbor(true);
  }

  const q = zakryto?.podskazka[lesenka.q];
  const lastQ = zakryto === null ? 0 : zakryto.podskazka.length;
  const shagRisunka = String(
    zakryto === null
      ? 0
      : (zakryto.podskazka[Math.min(lesenka.q, Math.max(lastQ - 1, 0))]?.shag ?? 0),
  );
  const risunokPodskazki = zakryto?.risunkiPodskazki[shagRisunka];

  return (
    <section className="ptask z9-ptask">
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
            /* Рисунок условия — без построений: они только в подсказке и решении. */
            <FiguraSvg9 className="z9-ptask__pic" svg={task.risunokSvg} label={OPORNYE_9.risunok} />
          )}
        </div>

        {podskazka && zakryto !== null ? (
          <aside className="ptask__hint z9-lesenka">
            <p className="ptask__hint-head">
              <HintIcon />
              {OPORNYE_9.podskazka}
            </p>
            {zakryto.podskazka.slice(0, lesenka.q).map((done, i) => (
              <div className="z9-lesenka__done" key={i}>
                <p
                  className="z9-lesenka__q"
                  dangerouslySetInnerHTML={{ __html: done.voprosHtml }}
                />
                <p
                  className="z9-lesenka__itog"
                  dangerouslySetInnerHTML={{ __html: done.itogHtml }}
                />
              </div>
            ))}
            {q === undefined ? (
              <p className="z9-lesenka__q">Теперь вы готовы ответить на вопрос задачи.</p>
            ) : (
              <div className="z9-lesenka__now">
                <p className="z9-lesenka__q" dangerouslySetInnerHTML={{ __html: q.voprosHtml }} />
                <ul className="z9-lesenka__options">
                  {q.varianty.map((v, i) => (
                    <li key={i}>
                      <button
                        type="button"
                        className={clsx('popt', lesenka.wrong === i && 'is-wrong')}
                        onClick={() =>
                          v.verno
                            ? setLesenka({ q: lesenka.q + 1, wrong: null })
                            : setLesenka({ q: lesenka.q, wrong: i })
                        }
                      >
                        <span className="popt__text" dangerouslySetInnerHTML={{ __html: v.html }} />
                      </button>
                    </li>
                  ))}
                </ul>
                {lesenka.wrong === null ? null : (
                  <p
                    className="z9-lesenka__why"
                    role="status"
                    dangerouslySetInnerHTML={{
                      __html: q.varianty[lesenka.wrong]?.pochemuHtml ?? '',
                    }}
                  />
                )}
              </div>
            )}
            {risunokPodskazki === undefined ? null : (
              <FiguraSvg9
                className="z9-lesenka__pic"
                svg={risunokPodskazki}
                label="Рисунок подсказки"
              />
            )}
          </aside>
        ) : null}
      </article>

      <div className="ptask__answer">
        <p className="ptask__label" id="p9-answer-label">
          Ваш ответ:
        </p>

        {task.answerType === 'choice' && task.varianty !== null ? (
          <ul className="ptask__options" aria-labelledby="p9-answer-label">
            {task.varianty.map((html, i) => (
              <li key={i}>
                <button
                  type="button"
                  className={clsx(
                    'popt',
                    value === String(i) && 'is-chosen',
                    value === String(i) && checked !== null && `is-${checked}`,
                  )}
                  aria-pressed={value === String(i)}
                  onClick={() => {
                    if (checked !== 'right') {
                      setValue(String(i));
                      setChecked(null);
                    }
                  }}
                >
                  <span className="popt__no">{i + 1}</span>
                  <span className="popt__text" dangerouslySetInnerHTML={{ __html: html }} />
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
            aria-labelledby="p9-answer-label"
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

        {razbor && zakryto !== null ? (
          <div className="z9-razbor" role="region" aria-label={OPORNYE_9.reshenie}>
            <p className="z9-razbor__title">{OPORNYE_9.reshenie}</p>
            <div className="z9-razbor__body">
              <div className="z9-razbor__lines">
                {zakryto.razborHtml.map((line, i) => (
                  <p
                    className="z9-razbor__line"
                    key={i}
                    dangerouslySetInnerHTML={{ __html: line }}
                  />
                ))}
              </div>
              {zakryto.risunokRazbora === null ? null : (
                <FiguraSvg9
                  className="z9-razbor__pic"
                  svg={zakryto.risunokRazbora}
                  label={OPORNYE_9.risunokRazbora}
                />
              )}
            </div>
          </div>
        ) : null}

        <div className="ptask__actions">
          {checked !== 'right' ? (
            <>
              <Button onClick={check} disabled={!ready}>
                Проверить
              </Button>
              <Button variant="ghost" onClick={togglePodskazka}>
                {podskazka ? OPORNYE_9.skryt : OPORNYE_9.podskazka}
              </Button>
              {checked === 'wrong' ? (
                <Button variant="ghost" onClick={showSolution} disabled={razbor}>
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
                  {OPORNYE_9.kListu}
                </Link>
              ) : (
                <Button onClick={() => open(nextOpen)}>
                  {nextOpen === index + 1 ? 'Следующее задание →' : 'Следующая нерешённая →'}
                </Button>
              )}
              <Button variant="ghost" onClick={showSolution} disabled={razbor}>
                Показать решение
              </Button>
            </>
          )}
          <Button variant="ghost" onClick={another}>
            {OPORNYE_9.again}
          </Button>
        </div>
      </div>

      <aside className="z9-memo">
        <p className="z9-memo__title">{OPORNYE_9.zapomni}</p>
        <ul className="z9-memo__list">
          {zapomniHtml.map((html, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: html }} />
          ))}
        </ul>
      </aside>
    </section>
  );
}
