'use client';

import Link from 'next/link';
import { useId, useState, type ReactNode } from 'react';
import { clsx } from 'clsx';
import { Button, Input } from '@/components/ui';
import { RightIcon, WrongIcon } from '@/components/tasks/prep/PrepIcons';
import { HintFlow11 } from '@/components/tasks/zadanie11/HintFlow11';
import { OPORNYE_3 } from '@/content/stereo/opornye3';
import { nextUnsolved, type TaskStatus } from '@/lib/prepOrder';
import { scrollTabTo } from '@/lib/tabScroll';
import { itog3, opornye3, zapisat3 } from '@/lib/stereo/opornye3/progress';
import type { RazborOp3, ShagHtml, ZadachaOp3Sealed } from '@/lib/stereo/opornye3/seal';
import { answerMatches, choiceMatches, openText } from '@/lib/stereo/opornye3/secret';
import { NazhmiChertezh } from './NazhmiChertezh';

export interface OpornyeStereoScreenProps {
  blokId: string;
  no: number;
  title: string;
  umenie: string;
  tasks: ZadachaOp3Sealed[];
  /** Живые чертежи задач, собранные на сборке (у «нажми» — свой, интерактивный). */
  risunki: ReactNode[];
  listHref: string;
  teoriyaHref: string;
}

function izJson<T>(json: string): T | null {
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

function firstOpen(status: TaskStatus[]): number {
  const found = status.findIndex((item) => item === null || item === 'skipped');
  return found === -1 ? 0 : found;
}

/**
 * Экран блока опорных задач №3. Задачи по ленте номеров; ответ — число,
 * выбор, касание чертежа или выбор плоского чертежа. Подсказка —
 * вопросы по шагам главного алгоритма ①–⑤; решение — по этапам
 * (учитель) и словами с формулами (ученик). Когда все задачи блока
 * закрыты — итог блока.
 */
export function OpornyeStereoScreen({
  blokId,
  no,
  title,
  umenie,
  tasks,
  risunki,
  listHref,
  teoriyaHref,
}: OpornyeStereoScreenProps) {
  const progress = opornye3.useProgress();
  const labelId = useId();
  const [attempts, setAttempts] = useState<Record<string, 'wrong' | 'skipped'>>({});
  const [picked, setPicked] = useState<number | null>(null);
  const [value, setValue] = useState('');
  const [checked, setChecked] = useState<'right' | 'wrong' | null>(null);
  const [shagi, setShagi] = useState<ShagHtml[] | null>(null);
  const [razbor, setRazbor] = useState<RazborOp3 | null>(null);

  const status: TaskStatus[] = tasks.map((t) => {
    const itog = itog3(progress, t.id);
    if (itog === 'right') return 'right';
    if (itog !== null) return 'wrong';
    return attempts[t.id] ?? null;
  });
  const index = picked ?? firstOpen(status);
  const task = tasks[index];
  if (task === undefined) return null;
  const total = tasks.length;
  const nextOpen = nextUnsolved(status, index);
  const right = status.filter((s) => s === 'right').length;
  const wrong = status.filter((s) => s === 'wrong').length;
  const done = status.every((s) => s === 'right' || s === 'wrong');
  const solved = checked === 'right';
  const ready = value.trim() !== '';

  function reset() {
    setValue('');
    setChecked(null);
    setShagi(null);
    setRazbor(null);
  }

  function open(next: number) {
    setPicked(next);
    reset();
    scrollTabTo('.ptask__card');
  }

  function check() {
    if (!ready || task === undefined) return;
    const ok = task.vid === 'chislo' ? answerMatches(value, task.seal) : choiceMatches(value, task.seal);
    setPicked(index);
    setChecked(ok ? 'right' : 'wrong');
    zapisat3(blokId, task.id, ok ? 'right' : 'wrong');
    if (!ok) setAttempts((prev) => ({ ...prev, [task.id]: 'wrong' }));
  }

  function skip() {
    if (task === undefined) return;
    setAttempts((prev) => ({ ...prev, [task.id]: 'skipped' }));
    if (nextOpen !== null) open(nextOpen);
  }

  function showSolution() {
    if (task === undefined) return;
    setRazbor(izJson<RazborOp3>(openText(task.razbor, task.id)));
    if (status[index] !== 'right') zapisat3(blokId, task.id, 'revealed');
  }

  const pick = (v: string) => {
    if (solved) return;
    setValue(v);
    setChecked(null);
  };

  return (
    <section className="ptask o3-ptask">
      <header className="ptask__head">
        <span className="o3-ptask__no" aria-hidden="true">
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
      <p className="o3-ptask__umenie">
        {OPORNYE_3.umenie}: {umenie}
      </p>

      {done ? (
        <div className="o3-itog" role="status">
          <p className="o3-itog__title">{OPORNYE_3.itog.title}</p>
          <p className="o3-itog__text">{OPORNYE_3.itog.text(right, total)}</p>
          {wrong > 0 ? <p className="o3-itog__text">{OPORNYE_3.itog.oshibki}</p> : null}
          <div className="o3-itog__links">
            <Link className="btn btn--secondary" href={teoriyaHref}>
              {OPORNYE_3.itog.teoriya}
            </Link>
            <Link className="btn btn--ghost" href={listHref}>
              {OPORNYE_3.kListu}
            </Link>
          </div>
        </div>
      ) : null}

      <ol className="ptask__dots">
        {tasks.map((t, i) => {
          const s = status[i] ?? null;
          return (
            <li key={t.id}>
              <button
                type="button"
                className={clsx('pdot', s !== null && `is-${s}`, i === index && 'is-current')}
                aria-current={i === index ? 'true' : undefined}
                onClick={() => open(i)}
              >
                {t.no}
                <span className="sr-only">
                  {s === 'right' ? ' — решено верно' : null}
                  {s === 'wrong' ? ' — решено неверно' : null}
                  {s === 'skipped' ? ' — пропущено' : null}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <article className="ptask__card o3-card">
        <div className="ptask__text">
          <p className="o3-metki">
            <span>{OPORNYE_3.zadacha(task.no, total)}</span>
            <span className="o3-metki__lv" aria-label={`Уровень ${task.uroven} из 3`}>
              {OPORNYE_3.uroven(task.uroven)}
            </span>
            <span className="o3-metki__src">{OPORNYE_3.istochnik[task.istochnik]}</span>
          </p>
          <div className="ptask__question" dangerouslySetInnerHTML={{ __html: task.uslovieHtml }} />
        </div>
        {task.vid === 'nazhmi' ? null : <div className="o3-card__ris">{risunki[index]}</div>}
        {shagi === null ? null : <HintFlow11 key={task.id} shagi={shagi} />}
      </article>

      <div className="ptask__answer">
        <p className="ptask__label" id={labelId}>
          {OPORNYE_3.vid[task.vid]}
        </p>

        {task.vid === 'chislo' ? (
          <Input
            className="ptask__input"
            value={value}
            state={checked === null ? 'default' : solved ? 'success' : 'error'}
            inputMode="decimal"
            autoComplete="off"
            aria-labelledby={labelId}
            readOnly={solved}
            onChange={(event) => pick(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') check();
            }}
          />
        ) : null}

        {task.vid === 'nazhmi' ? (
          <NazhmiChertezh
            task={task}
            value={value}
            onPick={pick}
            disabled={solved}
            proverka={checked}
            labelId={labelId}
          />
        ) : null}

        {task.vid === 'vybor' ? (
          <ul className="ptask__options" aria-labelledby={labelId}>
            {(task.varianty ?? []).map((html, i) => (
              <li key={i}>
                <button
                  type="button"
                  className={clsx(
                    'popt',
                    value === String(i) && 'is-chosen',
                    value === String(i) && checked !== null && `is-${checked}`,
                  )}
                  aria-pressed={value === String(i)}
                  onClick={() => pick(String(i))}
                >
                  <span className="popt__no">{i + 1}</span>
                  <span className="popt__text" dangerouslySetInnerHTML={{ __html: html }} />
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {task.vid === 'ploskiy' ? (
          <ul className="o3-ploskie" aria-labelledby={labelId}>
            {(task.ploskie ?? []).map((svg, i) => (
              <li key={i}>
                <button
                  type="button"
                  className={clsx(
                    'o3-plosk',
                    value === String(i) && 'is-chosen',
                    value === String(i) && checked !== null && `is-${checked}`,
                  )}
                  aria-pressed={value === String(i)}
                  onClick={() => pick(String(i))}
                >
                  <span className="o3-plosk__no">{OPORNYE_3.plosk(i + 1)}</span>
                  <span className="o3-plosk__svg" dangerouslySetInnerHTML={{ __html: svg }} />
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {checked === null ? null : (
          <div className={clsx('pverdict', `pverdict--${checked}`)} role="status">
            <p className="pverdict__title">{checked === 'right' ? OPORNYE_3.verno.title : OPORNYE_3.neverno.title}</p>
            <p className="pverdict__lead">{checked === 'right' ? OPORNYE_3.verno.lead : OPORNYE_3.neverno.lead}</p>
          </div>
        )}

        {razbor === null ? null : (
          <div className="o3-reshenie" role="region" aria-label={OPORNYE_3.uchenik}>
            <p className="o3-reshenie__title">{OPORNYE_3.uchenik}</p>
            <ol className="o3-razbor" dangerouslySetInnerHTML={{ __html: razbor.uchenikHtml }} />
            <details className="o3-uchitel">
              <summary>{OPORNYE_3.uchitel}</summary>
              <div dangerouslySetInnerHTML={{ __html: razbor.uchitelHtml }} />
            </details>
            <p className="o3-otvet">
              {OPORNYE_3.otvet}: <span dangerouslySetInnerHTML={{ __html: razbor.otvetHtml }} />
            </p>
          </div>
        )}

        <div className="ptask__actions">
          {!solved ? (
            <>
              <Button onClick={check} disabled={!ready}>
                {OPORNYE_3.proverit}
              </Button>
              <Button
                variant="ghost"
                onClick={() =>
                  setShagi(shagi === null ? izJson<ShagHtml[]>(openText(task.podskazki, task.id)) : null)
                }
              >
                {shagi === null ? OPORNYE_3.podskazka : OPORNYE_3.skrytPodskazku}
              </Button>
              {checked !== null ? (
                <Button variant="ghost" onClick={showSolution} disabled={razbor !== null}>
                  {OPORNYE_3.reshenie}
                </Button>
              ) : (
                <Button variant="ghost" onClick={skip}>
                  {OPORNYE_3.propustit}
                </Button>
              )}
            </>
          ) : (
            <>
              {nextOpen === null ? (
                <Link className="btn btn--primary" href={listHref}>
                  {OPORNYE_3.kListu}
                </Link>
              ) : (
                <Button onClick={() => open(nextOpen)}>
                  {nextOpen === index + 1 ? OPORNYE_3.dalshe : OPORNYE_3.dalsheNereshennaya}
                </Button>
              )}
              <Button variant="ghost" onClick={showSolution} disabled={razbor !== null}>
                {OPORNYE_3.reshenie}
              </Button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
