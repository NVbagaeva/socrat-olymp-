'use client';

import Link from 'next/link';
import { useState } from 'react';
import { clsx } from 'clsx';
import { Button, Input } from '@/components/ui';
import { OPORNYE_13 } from '@/content/zadanie13';
import { nextUnsolved, type TaskStatus } from '@/lib/prepOrder';
import { scrollTabTo } from '@/lib/tabScroll';
import { checkSealed, type Verdict } from '@/lib/zadanie13/edinicy';
import {
  sealZadacha13,
  type Razbor13,
  type ShagHtml,
  type Zadacha13Sealed,
} from '@/lib/zadanie13/opornye/seal';
import { itog13, opornye13, zapisat13 } from '@/lib/zadanie13/progress';
import { answerMatches, choiceMatches, openText } from '@/lib/zadanie13/secret';
import { RightIcon, WrongIcon } from '../prep/PrepIcons';
import { HintFlow11 } from '../zadanie11/HintFlow11';
import { TablitsaZapolni13 } from './TablitsaZapolni13';

type Attempt = 'wrong' | 'skipped';

export interface Opornye13ScreenProps {
  blockId: string;
  no: string;
  title: string;
  vid: 'zadachi' | 'tip';
  /** Десять задач блока в закрытом виде, собраны на сборке. */
  tasks: (Zadacha13Sealed & { no: number })[];
  /** Плашка «Запомни», свёрстана. */
  zapomniHtml: string[];
  listHref: string;
}

function firstOpen(status: TaskStatus[]): number {
  const found = status.findIndex((item) => item === null || item === 'skipped');
  return found === -1 ? 0 : found;
}

function izJson<T>(json: string): T | null {
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

/** Seed для кнопки «Ещё вариант»: время и случайный хвост. */
function sluchaynyySeed(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Экран задачи «Опорных задач» №13.
 *
 * Устройство как у №11: ответ сверяется с отпечатком, исходы пишутся
 * в хранилище раздела, подсказка — пошаговые вопросы с кнопками,
 * решение по шагам закрыто и открывается по кнопке. Ответ в чужих
 * единицах — отдельный вердикт «Число верное, единицы нет», он не
 * засчитывается. «Ещё вариант» собирает задачу того же прототипа на
 * новом seed прямо в браузере.
 */
export function Opornye13Screen({
  blockId,
  no,
  title,
  vid,
  tasks,
  zapomniHtml,
  listHref,
}: Opornye13ScreenProps) {
  const progress = opornye13.useProgress();
  const [attempts, setAttempts] = useState<Record<number, Attempt>>({});
  const [picked, setPicked] = useState<number | null>(null);
  const [value, setValue] = useState('');
  const [checked, setChecked] = useState<Verdict | null>(null);
  const [razbor, setRazbor] = useState<Razbor13 | null>(null);
  const [shagi, setShagi] = useState<ShagHtml[] | null>(null);
  /* Свежие варианты по номеру задачи: пока не просили — задача банка. */
  const [fresh, setFresh] = useState<Record<number, Zadacha13Sealed>>({});

  const status: TaskStatus[] = tasks.map((item) => {
    const itog = itog13(progress, blockId, item.no);
    if (itog === 'right') return 'right';
    if (itog !== null) return 'wrong';
    return attempts[item.no] ?? null;
  });
  const index = picked ?? firstOpen(status);
  const base = tasks[index];
  if (base === undefined) {
    return null;
  }
  const task: Zadacha13Sealed = fresh[base.no] ?? base;
  const total = tasks.length;
  const nextOpen = nextUnsolved(status, index);
  const right = status.filter((item) => item === 'right').length;
  const wrong = status.filter((item) => item === 'wrong').length;
  const ready = value.trim() !== '';
  const solved = checked === 'right';

  function reset() {
    setValue('');
    setChecked(null);
    setRazbor(null);
    setShagi(null);
  }

  function open(next: number) {
    setPicked(next);
    reset();
    scrollTabTo('.ptask__card');
  }

  function check() {
    if (!ready || base === undefined) {
      return;
    }
    const verdict: Verdict =
      task.vybory === null
        ? checkSealed(value, { answer: task.seal, wrongUnits: task.wrongUnits }, answerMatches)
        : choiceMatches(value, task.seal)
          ? 'right'
          : 'wrong';
    setPicked(index);
    setChecked(verdict);
    zapisat13(blockId, base.no, verdict === 'right' ? 'right' : 'wrong');
    if (verdict !== 'right') {
      setAttempts((prev) => ({ ...prev, [base.no]: 'wrong' }));
    }
  }

  function skip() {
    if (base === undefined) return;
    setAttempts((prev) => ({ ...prev, [base.no]: 'skipped' }));
    if (nextOpen !== null) {
      open(nextOpen);
    }
  }

  function another() {
    if (base === undefined) return;
    setPicked(index);
    setFresh((prev) => ({
      ...prev,
      [base.no]: sealZadacha13(base.prototypeId, sluchaynyySeed(), vid, base.no),
    }));
    reset();
  }

  function toggleHint() {
    setShagi(shagi === null ? izJson<ShagHtml[]>(openText(task.podskazki, task.seal)) : null);
  }

  function showSolution() {
    if (base === undefined) return;
    setRazbor(izJson<Razbor13>(openText(task.razbor, task.seal)));
    if (status[index] !== 'right') {
      zapisat13(blockId, base.no, 'revealed');
    }
  }

  return (
    <section className="ptask z13-ptask">
      <header className="ptask__head">
        <span className="z13-ptask__no" aria-hidden="true">
          {no}
        </span>
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
        Задача <b>{base.no}</b> из {total}
      </p>

      <ol className="ptask__dots">
        {tasks.map((item, i) => {
          const state = status[i] ?? null;
          return (
            <li key={`${item.prototypeId}:${item.seed}`}>
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
          {task.metki.length > 0 ? (
            <p className="z13-metki">
              {task.metki.map((m) => (
                <span key={m} className="z13-metka">
                  {m}
                </span>
              ))}
            </p>
          ) : null}
          <div className="ptask__question" dangerouslySetInnerHTML={{ __html: task.uslovieHtml }} />
          {task.tablitsaHtml === null ? null : (
            <div
              className="z13-ptask__tab"
              dangerouslySetInnerHTML={{ __html: task.tablitsaHtml }}
            />
          )}
          {task.zapolni === null ? null : (
            <TablitsaZapolni13 key={`${task.prototypeId}|${task.seed}`} t={task.zapolni} />
          )}
        </div>
        {shagi === null ? null : (
          <HintFlow11 key={`${task.prototypeId}|${task.seed}`} shagi={shagi} />
        )}
      </article>

      <div className="ptask__answer">
        <p className="ptask__label" id="p13-answer-label">
          {task.vybory === null ? 'Ваш ответ:' : OPORNYE_13.vybor}
        </p>

        {task.vybory !== null ? (
          <ul className="ptask__options" aria-labelledby="p13-answer-label">
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
                    if (!solved) {
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
          <Input
            className="ptask__input"
            value={value}
            state={checked === null ? 'default' : solved ? 'success' : 'error'}
            inputMode="decimal"
            autoComplete="off"
            aria-labelledby="p13-answer-label"
            onChange={(event) => {
              setValue(event.target.value);
              if (checked !== null && !solved) {
                setChecked(null);
              }
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                check();
              }
            }}
            readOnly={solved}
          />
        )}

        {checked === null ? null : (
          <div
            className={clsx('pverdict', `pverdict--${checked === 'right' ? 'right' : 'wrong'}`)}
            role="status"
          >
            <p className="pverdict__title">{OPORNYE_13.verdikt[checked].title}</p>
            <p className="pverdict__lead">{OPORNYE_13.verdikt[checked].lead}</p>
          </div>
        )}

        {razbor === null ? null : (
          <div className="z13-oreshenie" role="region" aria-label={OPORNYE_13.reshenie}>
            <p className="z13-oreshenie__title">{OPORNYE_13.reshenie}</p>
            <div className="z13-reshenie" dangerouslySetInnerHTML={{ __html: razbor.html }} />
            <p className="z13-otvet">
              {OPORNYE_13.otvet}: {razbor.otvet}
            </p>
          </div>
        )}

        <div className="ptask__actions">
          {!solved ? (
            <>
              <Button onClick={check} disabled={!ready}>
                Проверить
              </Button>
              <Button variant="ghost" onClick={toggleHint}>
                {shagi === null ? OPORNYE_13.podskazka : OPORNYE_13.skrytPodskazku}
              </Button>
              {checked !== null ? (
                <Button variant="ghost" onClick={showSolution} disabled={razbor !== null}>
                  Показать решение
                </Button>
              ) : (
                <Button variant="ghost" onClick={skip}>
                  Пропустить задачу
                </Button>
              )}
            </>
          ) : (
            <>
              {nextOpen === null ? (
                <Link className="btn btn--primary" href={listHref}>
                  {OPORNYE_13.kListu}
                </Link>
              ) : (
                <Button onClick={() => open(nextOpen)}>
                  {nextOpen === index + 1 ? 'Следующая задача →' : 'Следующая нерешённая →'}
                </Button>
              )}
              <Button variant="ghost" onClick={showSolution} disabled={razbor !== null}>
                Показать решение
              </Button>
            </>
          )}
          <Button variant="ghost" onClick={another}>
            {OPORNYE_13.again}
          </Button>
        </div>
      </div>

      <aside className="z13-memo">
        <p className="z13-memo__title">{OPORNYE_13.zapomni}</p>
        <ul className="z13-memo__list">
          {zapomniHtml.map((html, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: html }} />
          ))}
        </ul>
      </aside>
    </section>
  );
}
