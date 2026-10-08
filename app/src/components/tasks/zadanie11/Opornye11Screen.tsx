'use client';

import Link from 'next/link';
import { useState } from 'react';
import { clsx } from 'clsx';
import { Button, Input } from '@/components/ui';
import { praviloOdinRaz } from './praviloProporcii';
import { BLOK_11 } from '@/content/opornye11';
import { OPORNYE_11 } from '@/content/zadanie11';
import { nextUnsolved, type TaskStatus } from '@/lib/prepOrder';
import { scrollTabTo } from '@/lib/tabScroll';
import { mikroById } from '@/lib/zadanie11/prep/bloki';
import { sluchaynyySeed } from '@/lib/zadanie11/prep/generate';
import {
  sealMikro11,
  type MikroRazbor11,
  type MikroSealed11,
  type ShagHtml,
} from '@/lib/zadanie11/prep/seal';
import type { RazdelBloka } from '@/lib/zadanie11/prep/types';
import { mikroItog11, mikroZapisat11, opornye11 } from '@/lib/zadanie11/progress';
import { answerMatches, choiceMatches, openText } from '@/lib/zadanie11/secret';
import { RightIcon, WrongIcon } from '../prep/PrepIcons';
import { HintFlow11 } from './HintFlow11';
import { IkonkaBloka, Piktogramma } from './Piktogrammy';
import { Tablitsa11 } from './Tablitsa11';

type Attempt = 'wrong' | 'skipped';

export interface Opornye11ScreenProps {
  blockId: string;
  razdel: RazdelBloka;
  title: string;
  /** Десять задач блока в закрытом виде, собраны на сборке. */
  tasks: (MikroSealed11 & { no: number })[];
  /** Плашка «Запомни», свёрстана. */
  zapomniHtml: string[];
  /** Зачем этот навык — строка под заголовком, свёрстана. */
  zachem: string;
  /** «Теория к этому блоку», свёрстана. */
  teoriyaHtml: string[];
  listHref: string;
  /** Куда дальше после 10/10. */
  dalee: {
    teoriyaHref: string;
    sled: { href: string; nazvanie: string } | null;
    trenazher: { href: string; razdel: string } | null;
  };
}

const VERDICT = {
  right: { title: 'Верно!', lead: 'Отлично! Переходим к следующему заданию.' },
  wrong: { title: 'Пока неверно', lead: 'Пройдите подсказку по шагам и попробуйте ещё раз.' },
};

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

/**
 * Экран микрозадачи «Опорных задач» №11.
 *
 * Устройство как у №2: ответ сверяется с отпечатком, исходы пишутся в
 * хранилище раздела. Вместо формулы-подсказки — пошаговые вопросы с
 * кнопками; разбор с заполненной таблицей закрыт и открывается по
 * кнопке. Таблица условия — с клетками «?». «Ещё вариант» собирает ту
 * же задачу на новом seed прямо в браузере.
 */
export function Opornye11Screen({
  blockId,
  razdel,
  title,
  tasks,
  zapomniHtml,
  zachem,
  teoriyaHtml,
  listHref,
  dalee,
}: Opornye11ScreenProps) {
  const progress = opornye11.useProgress();
  /* Теория свёрнута, пока не понадобилась: раскрывается кнопкой и
     сама — после первой ошибки. */
  const [teoriyaOpen, setTeoriyaOpen] = useState(false);
  const [attempts, setAttempts] = useState<Record<number, Attempt>>({});
  const [picked, setPicked] = useState<number | null>(null);
  const [value, setValue] = useState('');
  const [checked, setChecked] = useState<'right' | 'wrong' | null>(null);
  const [razbor, setRazbor] = useState<MikroRazbor11 | null>(null);
  const [shagi, setShagi] = useState<ShagHtml[] | null>(null);
  /* Свежие варианты по номеру задачи: пока не просили — зафиксированный. */
  const [fresh, setFresh] = useState<Record<number, MikroSealed11>>({});

  const status: TaskStatus[] = tasks.map((item) => {
    const itog = mikroItog11(progress, blockId, item.no);
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
  const task: MikroSealed11 = fresh[base.no] ?? base;
  const total = tasks.length;
  const nextOpen = nextUnsolved(status, index);
  const right = status.filter((item) => item === 'right').length;
  const wrong = status.filter((item) => item === 'wrong').length;
  const ready = value.trim() !== '';

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
    if (!ready) {
      return;
    }
    const correct =
      task.answerType === 'choice'
        ? choiceMatches(value, task.seal)
        : answerMatches(value, task.seal);
    setPicked(index);
    setChecked(correct ? 'right' : 'wrong');
    mikroZapisat11(blockId, base.no, correct ? 'right' : 'wrong');
    if (!correct) {
      setAttempts((prev) => ({ ...prev, [base.no]: 'wrong' }));
      setTeoriyaOpen(true);
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
    setFresh((prev) => ({ ...prev, [base.no]: sealMikro11(micro, sluchaynyySeed()) }));
    reset();
  }

  function toggleHint() {
    setShagi(shagi === null ? izJson<ShagHtml[]>(openText(task.podskazki, task.seal)) : null);
  }

  function showSolution() {
    setRazbor(izJson<MikroRazbor11>(openText(task.razbor, task.seal)));
    if (status[index] !== 'right') {
      mikroZapisat11(blockId, base.no, 'revealed');
    }
  }

  return (
    <section className="ptask z11-ptask">
      <header className="ptask__head">
        <IkonkaBloka razdel={razdel} className="z11-ptask__ikonka" />
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

      <p className="z11-ptask__zachem">
        <span className="z11-ptask__zachem-label">{BLOK_11.zachem}:</span>{' '}
        <span dangerouslySetInnerHTML={{ __html: zachem }} />
      </p>

      <section className={clsx('z11-bteor', teoriyaOpen && 'is-open')}>
        <button
          type="button"
          className="z11-bteor__head"
          aria-expanded={teoriyaOpen}
          onClick={() => setTeoriyaOpen(!teoriyaOpen)}
        >
          <Piktogramma name="book" className="z11-bteor__ikonka" />
          <span className="z11-bteor__title">{BLOK_11.teoriya}</span>
          <span className="z11-bteor__toggle">{teoriyaOpen ? BLOK_11.skryt : BLOK_11.pokazat}</span>
          <Piktogramma name="chevron" className="z11-bteor__chev" />
        </button>
        {teoriyaOpen ? (
          <div className="z11-bteor__body">
            <ul className="z11-bteor__list">
              {teoriyaHtml.map((html, i) => (
                <li key={i} dangerouslySetInnerHTML={{ __html: html }} />
              ))}
            </ul>
            <div className="z11-memo z11-memo--v-teorii">
              <p className="z11-memo__title">{OPORNYE_11.zapomni}</p>
              <ul className="z11-memo__list">
                {zapomniHtml.map((html, i) => (
                  <li key={i} dangerouslySetInnerHTML={{ __html: html }} />
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </section>

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
          {task.tablitsa === null ? null : (
            <Tablitsa11 table={task.tablitsa} className="z11-ptask__tab" />
          )}
        </div>
        {shagi === null ? null : <HintFlow11 key={`${task.id}|${task.seed}`} shagi={shagi} />}
      </article>

      <div className="ptask__answer">
        <p className="ptask__label" id="p11-answer-label">
          Ваш ответ:
        </p>

        {task.answerType === 'choice' && task.vybory !== null ? (
          <ul className="ptask__options" aria-labelledby="p11-answer-label">
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
            aria-labelledby="p11-answer-label"
            onChange={(event) => {
              setValue(event.target.value);
              if (checked === 'wrong') {
                setChecked(null);
              }
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                check();
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
          <div
            className="z11-razbor"
            role="region"
            aria-label={OPORNYE_11.reshenie}
            ref={praviloOdinRaz}
          >
            <p className="z11-razbor__title">{OPORNYE_11.reshenie}</p>
            {razbor.tablitsa === null ? null : <Tablitsa11 table={razbor.tablitsa} />}
            <div className="z11-razbor__lines">
              {razbor.stroki.map((line, i) => (
                <div
                  className="z11-razbor__line"
                  key={i}
                  dangerouslySetInnerHTML={{ __html: line }}
                />
              ))}
            </div>
          </div>
        )}

        <div className="ptask__actions">
          {checked !== 'right' ? (
            <>
              <Button onClick={check} disabled={!ready}>
                Проверить
              </Button>
              <Button variant="ghost" onClick={toggleHint}>
                {shagi === null ? OPORNYE_11.podskazka : OPORNYE_11.skrytPodskazku}
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
                  {OPORNYE_11.kListu}
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
            {OPORNYE_11.again}
          </Button>
        </div>
      </div>

      {right >= total ? (
        <aside className="z11-proyden" aria-label={BLOK_11.proyden.title}>
          <p className="z11-proyden__title">
            <Piktogramma name="check" />
            {BLOK_11.proyden.title}
          </p>
          <p className="z11-proyden__lead">{BLOK_11.proyden.lead}</p>
          <div className="z11-proyden__btns">
            <Link className="btn btn--secondary btn--sm" href={dalee.teoriyaHref}>
              <Piktogramma name="book" />
              {BLOK_11.proyden.teoriya}
            </Link>
            {dalee.sled === null ? null : (
              <Link className="btn btn--secondary btn--sm" href={dalee.sled.href}>
                <Piktogramma name="tools" />
                {BLOK_11.proyden.sled}: {dalee.sled.nazvanie}
              </Link>
            )}
            {dalee.trenazher === null ? null : (
              <Link className="btn btn--primary btn--sm" href={dalee.trenazher.href}>
                <Piktogramma name="play" />
                {BLOK_11.proyden.trenazher(dalee.trenazher.razdel)}
              </Link>
            )}
          </div>
        </aside>
      ) : null}
    </section>
  );
}
