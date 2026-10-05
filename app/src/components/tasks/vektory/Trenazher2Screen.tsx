'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { Button, FigureZoom, Input } from '@/components/ui';
import { TRENAZHER_2 } from '@/content/vektory';
import { pickRound, restartRound, useRound } from '@/lib/trainerRound';
import { progress2 } from '@/lib/vektory/progress';
import { answerMatches, openText } from '@/lib/vektory/secret';
import { kindTitle, type RazborTrenazhera, type Task2 } from '@/lib/vektory/session';
import { HintIcon, RightIcon, WrongIcon } from '../prep/PrepIcons';
import { Trenazher2Result, type Mark2 } from './Trenazher2Result';

export interface Trenazher2ScreenProps {
  pool: Task2[];
  roundKey: string;
  backHref: string;
  /** Контроль: без подсказок и решения до конца сессии. */
  control?: boolean;
}

/** Разбор: закрыт тем же отпечатком, что и ответ; раскрывается по нажатию. */
function razborOf(task: Task2): RazborTrenazhera {
  try {
    const value: unknown = JSON.parse(openText(task.razbor, task.seal));
    if (typeof value === 'object' && value !== null && 'shagi' in value) {
      return value as RazborTrenazhera;
    }
  } catch {
    /* Не раскрылось — разбора нет. */
  }
  return { shagi: [], risunokSvg: null };
}

/**
 * Экран задания тренажёра №2.
 *
 * Условие с рисунком без катетов и одно поле для ответа; запятая и
 * точка в ответе равноправны. Ответ сверяется с отпечатком: числа в
 * разметке нет. Подсказки — шаги разбора по одному: с первой
 * подсказкой рисунок переключается в режим катетов. Задача с
 * подсказками засчитывается как решённая с подсказкой, задача с
 * открытым полным решением до верного ответа не засчитывается.
 */
export function Trenazher2Screen({
  pool,
  roundKey,
  backHref,
  control = false,
}: Trenazher2ScreenProps) {
  const kinds = useMemo(() => pool.map((item) => kindTitle(item.prototype)), [pool]);
  const build = useCallback(() => pickRound(kinds, pool.length), [kinds, pool.length]);
  const order = useRound(roundKey, build);
  const tasks = useMemo(
    () =>
      order.length === 0
        ? pool
        : order.map((at) => pool[at]).filter((item): item is Task2 => item !== undefined),
    [order, pool],
  );

  const [index, setIndex] = useState(0);
  const [value, setValue] = useState('');
  const [checked, setChecked] = useState<'right' | 'wrong' | null>(null);
  const [marks, setMarks] = useState<Record<number, Mark2>>({});
  const [razbor, setRazbor] = useState<RazborTrenazhera | null>(null);
  /** Сколько шагов разбора открыто подсказками; все — полное решение. */
  const [shagov, setShagov] = useState(0);
  const [polnoe, setPolnoe] = useState(false);
  const [misses, setMisses] = useState(0);
  const [result, setResult] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const startedAt = useRef<number | null>(null);
  const taskStartedAt = useRef<number | null>(null);
  const failed = useRef(false);

  function startClock() {
    const now = Date.now();
    startedAt.current ??= now;
    taskStartedAt.current ??= now;
  }

  function taskSeconds(): number {
    const from = taskStartedAt.current;
    return from === null ? 0 : (Date.now() - from) / 1000;
  }

  function remember(item: Task2, right: boolean, clean: boolean) {
    progress2.recordAttempt({
      kind: item.prototype,
      taskId: item.id,
      right,
      clean,
      seconds: taskSeconds(),
    });
  }

  function stopClock() {
    const from = startedAt.current;
    setSeconds(from === null ? 0 : (Date.now() - from) / 1000);
  }

  const found = tasks[index];
  if (found === undefined) {
    return null;
  }
  const task: Task2 = found;
  const total = tasks.length;
  const last = index === total - 1;
  const ready = value.trim() !== '';
  /* Полное решение до верного ответа — задача не засчитана. */
  const revealed = polnoe && checked !== 'right';
  const hinted = shagov > 0;
  const shagi = razbor === null ? [] : razbor.shagi;
  const otkryto = polnoe ? shagi.length : Math.min(shagov, shagi.length);
  const estEshche = razbor !== null && otkryto < shagi.length;
  /* После первой подсказки — рисунок с катетами. */
  const risunokSvg = hinted || polnoe ? (razbor?.risunokSvg ?? task.risunokSvg) : task.risunokSvg;

  function check() {
    startClock();
    const right = answerMatches(value, task.seal);
    setChecked(right ? 'right' : 'wrong');
    if (right) {
      const clean = failed.current === false && !hinted && !polnoe;
      setMarks({
        ...marks,
        [index]: polnoe ? 'hinted' : clean ? 'right' : hinted ? 'hinted' : 'right',
      });
      remember(task, !polnoe, clean);
      if (last) {
        stopClock();
      }
    } else {
      failed.current = true;
      setMisses(misses + 1);
    }
  }

  function podskazka() {
    startClock();
    const opened = razbor ?? razborOf(task);
    setRazbor(opened);
    setShagov(Math.min(shagov + 1, opened.shagi.length));
  }

  function polnoeReshenie() {
    startClock();
    const opened = razbor ?? razborOf(task);
    setRazbor(opened);
    setPolnoe(true);
    if (checked !== 'right') {
      setMarks({ ...marks, [index]: 'hinted' });
      remember(task, false, false);
      if (last) {
        stopClock();
      }
    }
  }

  function next() {
    taskStartedAt.current = null;
    failed.current = false;
    setIndex(index + 1);
    setValue('');
    setChecked(null);
    setRazbor(null);
    setShagov(0);
    setPolnoe(false);
  }

  function again() {
    restartRound(roundKey);
    setResult(false);
    setIndex(0);
    setValue('');
    setChecked(null);
    setMarks({});
    setMisses(0);
    setSeconds(0);
    setRazbor(null);
    setShagov(0);
    setPolnoe(false);
    startedAt.current = null;
    taskStartedAt.current = null;
    failed.current = false;
  }

  const nextButton = last ? (
    <Button onClick={() => setResult(true)}>{TRENAZHER_2.rezultat}</Button>
  ) : (
    <Button onClick={next}>{TRENAZHER_2.sleduyushchaya}</Button>
  );

  if (result) {
    return (
      <Trenazher2Result
        tasks={tasks}
        marks={marks}
        misses={misses}
        seconds={seconds}
        backHref={backHref}
        onAgain={again}
      />
    );
  }

  const done = checked === 'right' || revealed;

  return (
    <section className="ttask z2-ttask">
      <p className="ttask__count">
        Задание <b>{index + 1}</b> из {total} · {task.prototype}
      </p>

      <ol className="ttask__dots" aria-hidden="true">
        {tasks.map((item, i) => (
          <li
            key={`${i}-${item.id}`}
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
          <div
            className="ptask__question"
            dangerouslySetInnerHTML={{ __html: task.questionHtml }}
          />
          {risunokSvg === null ? null : (
            <FigureZoom
              className="chart ptask__chart z2-ptask__pic"
              label={`Рисунок к заданию ${index + 1}`}
            >
              <span className="vp-wrap" dangerouslySetInnerHTML={{ __html: risunokSvg }} />
            </FigureZoom>
          )}
        </div>
      </article>

      <div className="ttask__answer">
        <p className="ptask__label" id="ttask2-answer-label">
          {TRENAZHER_2.otvetLabel}
        </p>
        <Input
          className="ttask__input"
          value={value}
          state={checked === null ? 'default' : checked === 'right' ? 'success' : 'error'}
          inputMode="decimal"
          autoComplete="off"
          aria-labelledby="ttask2-answer-label"
          aria-describedby="ttask2-answer-hint"
          readOnly={checked === 'right'}
          onChange={(event) => {
            setValue(event.target.value);
            if (checked === 'wrong') {
              setChecked(null);
            }
          }}
        />
        <p className="z2-ttask__hint t-caption" id="ttask2-answer-hint">
          {TRENAZHER_2.otvetHint}
        </p>

        {checked === null ? null : (
          <div className={clsx('tverdict', `tverdict--${checked}`)} role="status">
            <p className="tverdict__title">
              <span className="tverdict__ico">
                {checked === 'right' ? <RightIcon /> : <WrongIcon />}
              </span>
              {checked === 'right' ? TRENAZHER_2.verno : TRENAZHER_2.oshibka}
            </p>
            {control ? null : (
              <p className="tverdict__text">
                {checked === 'right'
                  ? revealed || (polnoe && marks[index] === 'hinted' && !hinted)
                    ? TRENAZHER_2.vernoPosleResheniya
                    : hinted
                      ? TRENAZHER_2.vernoSPodskazkoy
                      : TRENAZHER_2.vernoText
                  : TRENAZHER_2.oshibkaText}
              </p>
            )}
          </div>
        )}

        {/* Подсказки — шаги разбора по одному; полное решение — все
            шаги. В режиме «Контроль» ни того, ни другого нет. */}
        {otkryto > 0 ? (
          <div
            className="z2-razbor"
            role="region"
            aria-label={polnoe ? TRENAZHER_2.polnoe : TRENAZHER_2.podskazka}
          >
            <p className="z2-razbor__title">
              <HintIcon />
              {polnoe
                ? TRENAZHER_2.polnoe
                : `${TRENAZHER_2.podskazka}: шаг ${otkryto} из ${shagi.length}`}
            </p>
            <ol className="z2-shagi">
              {shagi.slice(0, otkryto).map((shag, i) => (
                <li className="z2-shag" key={i}>
                  <p
                    className="z2-shag__title"
                    dangerouslySetInnerHTML={{ __html: shag.zagolovokHtml }}
                  />
                  {shag.strokiHtml.map((line, j) => (
                    <p
                      className="z2-shag__line"
                      key={j}
                      dangerouslySetInnerHTML={{ __html: line }}
                    />
                  ))}
                </li>
              ))}
            </ol>
          </div>
        ) : null}

        <div className="ttask__actions">
          {done ? (
            <>
              {nextButton}
              {!polnoe && !control ? (
                <Button variant="ghost" onClick={polnoeReshenie}>
                  {TRENAZHER_2.polnoe}
                </Button>
              ) : null}
            </>
          ) : (
            <>
              <Button onClick={check} disabled={!ready}>
                {TRENAZHER_2.proverit}
              </Button>
              {control ? null : (
                <>
                  {estEshche || razbor === null ? (
                    <span className="thint__offer">
                      <Button variant="ghost" onClick={podskazka}>
                        {hinted ? TRENAZHER_2.sleduyushchiyShag : TRENAZHER_2.podskazka}
                      </Button>
                      {hinted ? null : (
                        <span className="thint__warn">{TRENAZHER_2.podskazkaWarn}</span>
                      )}
                    </span>
                  ) : null}
                  {polnoe ? null : (
                    <span className="thint__offer">
                      <Button variant="ghost" onClick={polnoeReshenie}>
                        {TRENAZHER_2.polnoe}
                      </Button>
                      <span className="thint__warn">{TRENAZHER_2.polnoeWarn}</span>
                    </span>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
