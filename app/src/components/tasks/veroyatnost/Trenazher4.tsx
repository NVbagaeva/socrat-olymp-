'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { Button, EmptyState } from '@/components/ui';
import { ProblemCard } from '@/components/tasks/card';
import { REZHIMY_4, TRENAZHER_4, type Rezhim4 } from '@/content/veroyatnost';
import { createProgressStore } from '@/lib/progressStore';
import { METODY, METODY_4, type Method } from '@/lib/veroyatnost/model';
import type { Pool, PoolKind } from '@/lib/veroyatnost/pool';
import { ROUND_SIZE, restartRound, useVeroyatnostRound } from '@/lib/veroyatnost/useRound';
import { ProgressMetody } from './ProgressMetody';

export interface Trenazher4Props {
  pool: Pool;
}

/**
 * Тренажёр задания №4 — раздел 07 референса.
 *
 * Три режима: «Отработка» — один метод, задачи только этого метода;
 * «Смешанная» — все методы вперемешку, ученик сам распознаёт
 * структуру, поэтому названия метода в шапке карточки нет; «Повтор
 * ошибок» — только те задачи, где ответ не сошёлся или было открыто
 * решение. Прогресс считается отдельно по каждому методу и живёт в
 * своём хранилище: сброс здесь не трогает ни задание №12, ни режим
 * «Узнай метод».
 *
 * Сама задача — ProblemCard: условие, рисунок по модели, решение по
 * шагам. Правильных ответов в разметке нет — карточка сверяет ввод с
 * отпечатком и открывает закрытый разбор только по действию ученика.
 *
 * Порядок подхода собирает хранилище в useRound после монтирования:
 * при отрисовке компонент ни часов, ни случайных чисел не спрашивает,
 * поэтому разметка сервера и первая отрисовка в браузере совпадают.
 */

/** Своё хранилище: ключ с номером задания и версией формата. */
export const progress4 = createProgressStore('budetege:veroyatnost-4:v1');

/** Идентификатор задачи в списке ошибок: прототип и номер варианта. */
function zadachaId(kind: string, n: number): string {
  return `${kind}:${n}`;
}

/** Метод прототипа: он один на все варианты, поэтому берётся с первого. */
function metodKind(kind: PoolKind): Method | undefined {
  return kind.variants[0]?.model?.method;
}

function nazvanieMetoda(id: Method | undefined): string | undefined {
  return METODY.find((m) => m.id === id)?.nazvanie;
}

export function Trenazher4({ pool }: Trenazher4Props) {
  const [rezhim, setRezhim] = useState<Rezhim4>('practice');
  const [metod, setMetod] = useState<Method>('direct-count');
  const [index, setIndex] = useState(0);
  /* Сколько решено с первой попытки: в счёт подхода идёт только это. */
  const [srazu, setSrazu] = useState(0);
  const progress = progress4.useProgress();

  const byId = useMemo(() => new Map(pool.kinds.map((kind) => [kind.id, kind])), [pool]);

  /* Из чего собирать подход. Отработка — прототипы одного метода,
     смешанная — все, повтор — только ошибочные варианты. */
  const source = useMemo(() => {
    if (rezhim === 'mistakes') {
      const oshibki = new Set(progress.mistakes);
      return pool.kinds
        .map((kind) => ({
          id: kind.id,
          variants: kind.variants
            .filter((v) => oshibki.has(zadachaId(kind.id, v.n)))
            .map((v) => ({ n: v.n })),
        }))
        .filter((kind) => kind.variants.length > 0);
    }
    return pool.kinds
      .filter((kind) => rezhim === 'mixed' || metodKind(kind) === metod)
      .map((kind) => ({ id: kind.id, variants: kind.variants.map((v) => ({ n: v.n })) }));
    /* Список ошибок меняется по ходу подхода; подход при этом не
       пересобирается — он привязан к ключу, а не к источнику. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool, rezhim, metod]);

  const key = rezhim === 'practice' ? `v4:practice:${metod}` : `v4:${rezhim}`;
  const round = useVeroyatnostRound(key, source, ROUND_SIZE);
  const item = round[index];
  const kind = item === undefined ? undefined : byId.get(item.kind);
  const variant = kind?.variants.find((v) => v.n === item?.n);

  /* Задача закрывается один раз: первым ответом или открытым
     решением. Второй ответ после ошибки счётчиков не меняет. */
  const zakryto = useRef<string | null>(null);
  const nachalo = useRef(0);
  useEffect(() => {
    nachalo.current = Date.now();
  }, [key, index]);

  /* Время берётся в обработчике и передаётся сюда: часы в теле
     компонента линтер считает нечистым вызовом при отрисовке. */
  function zapisat(right: boolean, clean: boolean, seychas: number): void {
    if (item === undefined || kind === undefined) {
      return;
    }
    const id = zadachaId(item.kind, item.n);
    if (zakryto.current === id) {
      return;
    }
    zakryto.current = id;
    progress4.recordAttempt({
      kind: metodKind(kind) ?? 'direct-count',
      taskId: id,
      right,
      clean,
      seconds: (seychas - nachalo.current) / 1000,
    });
    if (right) {
      setSrazu((n) => n + 1);
    }
  }

  function smenitRezhim(next: Rezhim4): void {
    if (next === 'mistakes') {
      /* Повтор собирается из свежего списка: прошлый подход мог
         содержать задачи, которые с тех пор решены начисто. */
      restartRound('v4:mistakes');
    }
    setRezhim(next);
    setIndex(0);
    setSrazu(0);
  }

  function smenitMetod(next: Method): void {
    setMetod(next);
    setIndex(0);
    setSrazu(0);
  }

  function dalshe(): void {
    setIndex((n) => n + 1);
  }

  function zanovo(): void {
    restartRound(key);
    setIndex(0);
    setSrazu(0);
  }

  const pusto = rezhim === 'mistakes' ? TRENAZHER_4.netOshibok : TRENAZHER_4.netZadach;

  return (
    <section className="z4-trainer">
      <div className="z4-trainer__rezhimy" role="radiogroup" aria-label={TRENAZHER_4.rezhim}>
        {REZHIMY_4.map((r) => (
          <button
            key={r.id}
            type="button"
            role="radio"
            aria-checked={r.id === rezhim}
            className={clsx('z4-rezhim', r.id === rezhim && 'z4-rezhim--on')}
            onClick={() => smenitRezhim(r.id)}
          >
            <span className="z4-rezhim__title">{r.title}</span>
            <span className="z4-rezhim__lead">{r.lead}</span>
          </button>
        ))}
      </div>

      {rezhim === 'practice' ? (
        <div className="vtrainer__chips" role="radiogroup" aria-label={TRENAZHER_4.metod}>
          {METODY_4.map((m) => (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={m.id === metod}
              className={clsx('vchip', m.id === metod && 'vchip--on')}
              onClick={() => smenitMetod(m.id)}
            >
              {m.nomer}. {m.nazvanie}
            </button>
          ))}
        </div>
      ) : null}

      {source.length === 0 ? (
        <EmptyState title={pusto.title} description={pusto.text} />
      ) : round.length === 0 ? (
        /* До монтирования подхода нет: показываем место под него,
           а не пустой экран, который тут же сменится задачей. */
        <p className="vtrainer__wait">{TRENAZHER_4.zhdem}</p>
      ) : index >= round.length ? (
        <div className="vtrainer__done">
          <p className="vtrainer__done-title">{TRENAZHER_4.proyden}</p>
          <p className="vtrainer__done-score">
            С первой попытки решено <b>{srazu}</b> из <b>{round.length}</b>
          </p>
          <Button onClick={zanovo}>{TRENAZHER_4.zanovo}</Button>
        </div>
      ) : item !== undefined && kind !== undefined && variant !== undefined ? (
        <>
          <p className="z4-trainer__schet">{TRENAZHER_4.schet(index + 1, round.length)}</p>
          {/* Ключ — сама задача: следующая карточка начинается с чистого
              состояния, а не наследует введённый ответ. */}
          <ProblemCard
            key={zadachaId(item.kind, item.n)}
            zadacha={{
              id: zadachaId(item.kind, item.n),
              uslovie: variant.uslovie,
              seal: variant.seal,
              steps: variant.steps,
              ...(variant.model === undefined ? {} : { model: variant.model }),
            }}
            nomer={index + 1}
            /* Метод в шапке — только в отработке: в смешанном режиме и
               в повторе ученик должен узнать его сам. */
            {...(rezhim === 'practice' ? { metodLabel: nazvanieMetoda(metodKind(kind)) } : {})}
            istochnik={`${TRENAZHER_4.istochnik} · задачи ${kind.zadachnik[0]}–${kind.zadachnik[1]}`}
            onResult={(right) => zapisat(right, right, Date.now())}
            onReveal={() => zapisat(false, false, Date.now())}
            onNext={dalshe}
            nextLabel={index + 1 === round.length ? TRENAZHER_4.zavershit : TRENAZHER_4.dalshe}
          />
        </>
      ) : null}

      <ProgressMetody store={progress4} slova={TRENAZHER_4.progress} />
    </section>
  );
}
