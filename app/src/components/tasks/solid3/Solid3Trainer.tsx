'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { Button, Input } from '@/components/ui';
import type { Pool, PoolKind, PoolVariant } from '@/lib/zadanie3/pool';
import { recordTask, taskKey, useZ3Progress } from '@/lib/zadanie3/progress';
import { buildRound, otherVariant, seeded, type RoundItem } from '@/lib/zadanie3/podhod';
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

export function Solid3Trainer({ pool, roundKey }: Solid3TrainerProps) {
  const progress = useZ3Progress();
  const [mode, setMode] = useState<string>(MIX);
  /* Повторение ошибок — отдельный режим: подход собирается только из
     заданий, в которых ошиблись. */
  const [repeat, setRepeat] = useState(false);

  const byId = useMemo(() => new Map(pool.kinds.map((kind) => [kind.id, kind])), [pool]);

  /* Из чего собирать подход: один тип, все типы или список ошибок. */
  const source = useMemo(() => {
    if (repeat) {
      const wanted = new Map<string, number[]>();
      progress.mistakes.forEach((key) => {
        const [id, no] = key.split(':');
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
        variants: kind.variants.map((v) => ({ n: v.n })),
      }));
    }
    const only = byId.get(mode);
    return only === undefined
      ? []
      : [{ id: only.id, variants: only.variants.map((v) => ({ n: v.n })) }];
  }, [repeat, mode, pool, byId, progress.mistakes]);

  /* Ключ подхода включает режим: сменил фильтр — собрался другой
     подход, а прежний не мешается. Порядок решает браузер после
     монтирования: случайных чисел при отрисовке не берут. */
  const key = `${roundKey}:${repeat ? 'mistakes' : mode}:${repeat ? progress.mistakes.length : ''}`;
  const build = useCallback(
    () =>
      buildRound(
        source,
        seeded(Date.now() >>> 0),
        repeat
          ? Math.min(
              source.reduce((s, k) => s + k.variants.length, 0),
              10,
            )
          : undefined,
      ),
    [source, repeat],
  );
  const order = useZ3Round(key, build);

  const [index, setIndex] = useState(0);
  const [value, setValue] = useState('');
  const [checked, setChecked] = useState<'right' | 'wrong' | null>(null);
  const [solution, setSolution] = useState(false);
  /* Ошибался ли ученик в этом задании: в точность идёт только
     решённое с первой попытки. */
  const [missed, setMissed] = useState(false);
  const started = useRef<number>(Date.now());

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
      const seconds = (Date.now() - started.current) / 1000;
      recordTask(current.kind, current.n, !missed, seconds);
    } else {
      setMissed(true);
    }
  }

  function anotherVariant() {
    if (kind === undefined || current === undefined) {
      return;
    }
    const n = otherVariant(kind.variants, current.n, seeded(Date.now() >>> 0));
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

          {/* Полоса подхода: закрытое залито, текущее подсвечено. */}
          <ol className="z3t__bar" aria-hidden="true">
            {order.map((item, i) => (
              <li
                key={`${item.kind}-${item.n}-${i}`}
                className={clsx(
                  'z3t__seg',
                  progress.mistakes.includes(taskKey(item.kind, item.n)) && 'is-wrong',
                  (progress.kinds[item.kind]?.done ?? 0) > 0 &&
                    !progress.mistakes.includes(taskKey(item.kind, item.n)) &&
                    i < index &&
                    'is-done',
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
