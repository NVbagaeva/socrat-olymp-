'use client';

import { useMemo, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { Button, Input } from '@/components/ui';
import type { Pool, PoolKind, PoolVariant } from '@/lib/zadanie3/pool';
import { ROUND_SIZE, otherVariant, seeded, type RoundItem } from '@/lib/zadanie3/podhod';
import { recordTask, taskKey, useZ3Progress } from '@/lib/zadanie3/progress';
import { answerMatches, openText } from '@/lib/zadanie3/secret';
import { restartZ3Round, swapZ3Task, useZ3Round } from '@/lib/zadanie3/useRound';
import { Solid3Stats } from './Solid3Stats';

export interface Solid3TrainerProps {
  pool: Pool;
  /** Имя подхода в памяти вкладки: у каждого раздела своё. */
  roundKey: string;
}

/** Смешанный режим: не тип, а все типы сразу. */
const MIX = 'mix';

/**
 * Тренажёр задания №3.
 *
 * Все задания приходят готовыми пропсами: условия набраны KaTeX,
 * чертежи нарисованы движком — на сборке. Ответы уехали вниз только
 * отпечатками, разборы закрытыми, и раскрываются по просьбе ученика.
 *
 * Порядок подхода собирает хранилище в useRound: там же берётся и
 * зерно. Компонент при отрисовке ни часов, ни случайных чисел не
 * спрашивает, поэтому разметка сервера и первая отрисовка в
 * браузере совпадают, а подход не пересобирается сам собой.
 */
export function Solid3Trainer({ pool, roundKey }: Solid3TrainerProps) {
  const progress = useZ3Progress();
  const [mode, setMode] = useState<string>(MIX);
  /* Повторение ошибок — отдельный режим: подход собирается только из
     заданий, в которых ошиблись. */
  const [repeat, setRepeat] = useState(false);

  const byId = useMemo(() => new Map(pool.kinds.map((kind) => [kind.id, kind])), [pool]);

  const [index, setIndex] = useState(0);
  const [value, setValue] = useState('');
  const [checked, setChecked] = useState<'right' | 'wrong' | null>(null);
  const [solution, setSolution] = useState(false);
  /* Ошибался ли ученик в этом задании: в точность идёт только
     решённое с первой попытки. */
  const [missed, setMissed] = useState(false);
  /* Когда взялись за задание. Ноль — ещё не начинали. */
  const started = useRef<number>(0);

  /* Из чего собирать подход: один тип, все типы или список ошибок.
     Список ошибок берётся строкой, чтобы зависимость эффекта не
     менялась от каждой перерисовки хранилища. */
  const mistakesKey = progress.mistakes.join(',');
  const source = useMemo(() => {
    if (repeat) {
      const wanted = new Map<string, number[]>();
      mistakesKey
        .split(',')
        .filter((item) => item !== '')
        .forEach((item) => {
          const [id, no] = item.split(':');
          if (id === undefined || no === undefined || !byId.has(id)) {
            return;
          }
          wanted.set(id, [...(wanted.get(id) ?? []), Number(no)]);
        });
      return [...wanted.entries()].map(([id, list]) => ({
        id,
        variants: list.map((n) => ({ n })),
      }));
    }
    if (mode === MIX) {
      return pool.kinds.map((kind) => ({
        id: kind.id,
        variants: kind.variants.map((item) => ({ n: item.n })),
      }));
    }
    const only = byId.get(mode);
    return only === undefined
      ? []
      : [{ id: only.id, variants: only.variants.map((item) => ({ n: item.n })) }];
  }, [repeat, mode, pool, byId, mistakesKey]);

  const size = repeat
    ? Math.min(
        source.reduce((sum, kind) => sum + kind.variants.length, 0),
        ROUND_SIZE,
      )
    : ROUND_SIZE;

  /* Ключ подхода включает режим и список ошибок: сменил фильтр —
     собрался другой подход, а прежний остался лежать и вернётся,
     если переключиться назад. */
  const key = `${roundKey}:${repeat ? `mistakes:${mistakesKey}` : mode}`;
  const order = useZ3Round(key, source, size);

  const current: RoundItem | undefined = order[index];
  const kind: PoolKind | undefined = current === undefined ? undefined : byId.get(current.kind);
  const variant: PoolVariant | undefined =
    kind === undefined || current === undefined
      ? undefined
      : kind.variants.find((item) => item.n === current.n);

  const total = order.length;

  function reset() {
    setValue('');
    setChecked(null);
    setSolution(false);
    setMissed(false);
    started.current = Date.now();
  }

  function go(next: number) {
    setIndex(next);
    reset();
  }

  function choose(next: string) {
    setMode(next);
    setRepeat(false);
    setIndex(0);
    reset();
  }

  function check() {
    if (variant === undefined || current === undefined || value.trim() === '') {
      return;
    }
    const right = answerMatches(value, variant.seal);
    setChecked(right ? 'right' : 'wrong');
    if (right) {
      const seconds = started.current === 0 ? 0 : (Date.now() - started.current) / 1000;
      recordTask(current.kind, current.n, !missed, seconds);
    } else {
      setMissed(true);
    }
  }

  function anotherVariant() {
    if (kind === undefined || current === undefined) {
      return;
    }
    const seed = (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
    const n = otherVariant(kind.variants, current.n, seeded(seed));
    swapZ3Task(key, index, { kind: current.kind, n });
    reset();
  }

  const steps = useMemo(() => {
    if (variant === undefined || !solution) {
      return [];
    }
    /* Разбор раскрывается только по просьбе ученика: до этого он
       лежит закрытым и в разметку не попадает. */
    return openText(variant.steps, variant.seal).split('\n');
  }, [variant, solution]);

  const mistakes = progress.mistakes.filter((item) => byId.has(item.split(':')[0] ?? ''));

  return (
    <section className="z3t">
      {/* Фильтр по типам заданий раздела и смешанный режим. */}
      <nav className="z3t__filter" aria-label="Типы заданий">
        <button
          type="button"
          className={clsx('chip', !repeat && mode === MIX && 'is-active')}
          onClick={() => choose(MIX)}
        >
          Смешанный режим
        </button>
        {pool.kinds.map((item) => (
          <button
            key={item.id}
            type="button"
            className={clsx('chip', !repeat && mode === item.id && 'is-active')}
            onClick={() => choose(item.id)}
          >
            {item.title}
          </button>
        ))}
      </nav>

      {total === 0 || current === undefined || kind === undefined || variant === undefined ? (
        <p className="z3t__wait">Собираем подход…</p>
      ) : (
        <>
          <p className="z3t__count">
            Задание <b>{index + 1}</b> из {total}
            <span className="z3t__kind">{kind.title}</span>
          </p>

          {/* Полоса подхода: пройденное залито, текущее подсвечено. */}
          <ol className="z3t__bar" aria-hidden="true">
            {order.map((item, i) => (
              <li
                key={`${item.kind}-${item.n}-${i}`}
                className={clsx(
                  'z3t__seg',
                  i < index && 'is-done',
                  progress.mistakes.includes(taskKey(item.kind, item.n)) && 'is-wrong',
                  i === index && 'is-current',
                )}
              />
            ))}
          </ol>

          <article className="z3t__card">
            <div
              className="z3t__question"
              dangerouslySetInnerHTML={{ __html: variant.uslovieHtml }}
            />
            <span
              className="z3t__fig"
              dangerouslySetInnerHTML={{ __html: variant.svg ?? kind.svg }}
            />
          </article>

          <div className="z3t__answer">
            <label className="z3t__label" htmlFor="z3t-input">
              Ваш ответ:
            </label>
            <Input
              id="z3t-input"
              className="z3t__input"
              value={value}
              state={checked === null ? 'default' : checked === 'right' ? 'success' : 'error'}
              inputMode="decimal"
              autoComplete="off"
              readOnly={checked === 'right'}
              onChange={(event) => setValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  check();
                }
              }}
            />
            {kind.format === 'на-пи' ? (
              <p className="z3t__hint">Ответ уже делённый на π — саму π писать не нужно.</p>
            ) : null}

            {checked === null ? null : (
              <div className={clsx('z3t__verdict', `z3t__verdict--${checked}`)} role="status">
                <p className="z3t__verdict-title">{checked === 'right' ? 'Верно!' : 'Неверно'}</p>
                <p className="z3t__verdict-lead">
                  {checked === 'right'
                    ? 'Разбор ниже — посмотрите, если решали иначе.'
                    : 'Попробуйте ещё раз или посмотрите разбор решения.'}
                </p>
              </div>
            )}

            <div className="z3t__actions">
              {checked === 'right' ? null : (
                <Button onClick={check} disabled={value.trim() === ''}>
                  Проверить
                </Button>
              )}
              <Button variant="ghost" onClick={() => setSolution(true)} disabled={solution}>
                {checked === 'right' ? 'Показать решение' : 'Посмотреть решение'}
              </Button>
              <Button variant="ghost" onClick={anotherVariant}>
                Ещё один вариант
              </Button>
            </div>

            {solution ? (
              <ol className="z3t__steps">
                {steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            ) : null}
          </div>

          <div className="z3t__nav">
            <Button variant="ghost" onClick={() => go(index - 1)} disabled={index === 0}>
              ← Предыдущее
            </Button>
            <Button variant="ghost" onClick={() => go(index + 1)} disabled={index >= total - 1}>
              Следующее →
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                restartZ3Round(key);
                setIndex(0);
                reset();
              }}
            >
              Начать заново
            </Button>
          </div>
        </>
      )}

      <Solid3Stats
        pool={pool}
        progress={progress}
        onRepeat={
          mistakes.length === 0
            ? null
            : () => {
                setRepeat(true);
                setIndex(0);
                reset();
              }
        }
        onGoKind={choose}
      />
    </section>
  );
}
