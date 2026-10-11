'use client';

import Link from 'next/link';
import { useState } from 'react';
import { clsx } from 'clsx';
import { Button, FigureZoom, Input } from '@/components/ui';
import { OPORNYE_1 } from '@/content/zadanie1';
import { nextUnsolved, type TaskStatus } from '@/lib/prepOrder';
import { scrollTabTo } from '@/lib/tabScroll';
import { mikroById } from '@/lib/planimetriya/prep/bloki';
import { sluchaynyySeed } from '@/lib/planimetriya/prep/generate';
import { sealMikro, type MikroRazbor, type MikroSealed } from '@/lib/planimetriya/prep/seal';
import { mikroItog, mikroZapisat, opornye1 } from '@/lib/planimetriya/progress';
import { answerMatches, openText } from '@/lib/planimetriya/secret';
import { HintIcon, RightIcon, WrongIcon } from '../prep/PrepIcons';

type Attempt = 'wrong' | 'skipped';

export interface Opornye1ScreenProps {
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
 * Экран микрозадачи тренировок навыков №1.
 *
 * Как у №2: ответ сверяется с отпечатком, после ошибки показывается
 * формула, разбор закрыт и открывается по кнопке — вместе с чертежом
 * учителя. На чертеже условия построений нет. «Ещё вариант» собирает ту же задачу на новом seed
 * прямо в браузере.
 *
 * Исходы пишутся в хранилище раздела по действиям: верно, неверно,
 * открыл решение. Верное решение снимает прежний исход.
 */
export function Opornye1Screen({
  blockId,
  title,
  tasks,
  formulyHtml,
  listHref,
}: Opornye1ScreenProps) {
  const progress = opornye1.useProgress();
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
    const correct = answerMatches(value, task.seal);
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
    <section className="ptask z1-ptask">
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
            /* Чертёж условия — без построений: они только в разборе. */
            <FigureZoom className="chart ptask__chart z1-ptask__pic" label={OPORNYE_1.risunok}>
              <span className="pl-wrap" dangerouslySetInnerHTML={{ __html: task.risunokSvg }} />
            </FigureZoom>
          )}
        </div>
        {/* Подсказка — формула навыка. Появляется после ошибки или по
            кнопке «Формула»: ответа в ней нет. */}
        {checked === 'wrong' || memo ? (
          <aside className="ptask__hint">
            <p className="ptask__hint-head">
              <HintIcon />
              {OPORNYE_1.formula}
            </p>
            <div
              className="ptask__hint-text"
              dangerouslySetInnerHTML={{ __html: task.formulaHtml }}
            />
          </aside>
        ) : null}
      </article>

      <div className="ptask__answer">
        <p className="ptask__label" id="p1-answer-label">
          Ваш ответ:
        </p>

        <Input
          className="ptask__input"
          value={value}
          state={checked === null ? 'default' : checked === 'right' ? 'success' : 'error'}
          inputMode="text"
          autoComplete="off"
          aria-labelledby="p1-answer-label"
          onChange={(event) => {
            setValue(event.target.value);
            if (checked === 'wrong') {
              setChecked(null);
            }
          }}
          readOnly={checked === 'right'}
        />

        {checked === null ? null : (
          <div className={clsx('pverdict', `pverdict--${checked}`)} role="status">
            <p className="pverdict__title">{VERDICT[checked].title}</p>
            <p className="pverdict__lead">{VERDICT[checked].lead}</p>
          </div>
        )}

        {razbor === null ? null : (
          <div className="z1-mrazbor" role="region" aria-label={OPORNYE_1.reshenie}>
            <p className="z1-mrazbor__title">{OPORNYE_1.reshenie}</p>
            <div className="z1-mrazbor__body">
              <div className="z1-mrazbor__lines">
                {razbor.stroki.map((line, i) => (
                  <p
                    className="z1-mrazbor__line"
                    key={i}
                    dangerouslySetInnerHTML={{ __html: line }}
                  />
                ))}
              </div>
              {razbor.risunokSvg === null ? null : (
                <FigureZoom className="z1-mrazbor__pic" label={OPORNYE_1.risunokRazbora}>
                  <span
                    className="pl-wrap"
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
                {memo ? 'Скрыть формулу' : OPORNYE_1.formula}
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
                  {OPORNYE_1.kListu}
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
            {OPORNYE_1.again}
          </Button>
        </div>
      </div>

      <aside className="z1-memo">
        <p className="z1-memo__title">{OPORNYE_1.zapomni}</p>
        <ul className="z1-memo__list">
          {formulyHtml.map((html, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: html }} />
          ))}
        </ul>
      </aside>
    </section>
  );
}
