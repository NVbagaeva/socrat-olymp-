'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { Button } from '@/components/ui';
import { ProblemCard } from '@/components/tasks/card';
import { PrepDots } from '@/components/tasks/prep/PrepDots';
import { RightIcon, WrongIcon } from '@/components/tasks/prep/PrepIcons';
import { TrainerResult, type TrainerMark } from '@/components/tasks/trainer';
import { trenazherSlova, uznaySlova, type Rezhim, type Zadanie } from '@/content/veroyatnost';
import type { ProgressStore } from '@/lib/progressStore';
import { METODY, metodPoId, type Method } from '@/lib/veroyatnost/model';
import type { Pool, UznayPool } from '@/lib/veroyatnost/pool';
import { openText, sealMetod } from '@/lib/veroyatnost/secret';
import { useVeroyatnostRound, type RoundKind } from '@/lib/veroyatnost/useRound';
import { MethodPicker } from './MethodPicker';
import { metodKind, metodyZadaniya, seychas, zadachaId } from './metody';

/** Что собрал конфигуратор: режим, метод, откуда брать задачи и сколько. */
export interface SessiyaPlan {
  /** Ключ подхода: новый на каждый запуск. */
  key: string;
  rezhim: Rezhim;
  /** Метод отработки; в остальных режимах не важен. */
  metod: Method;
  source: RoundKind[];
  size: number;
}

export interface SessiyaProps {
  zadanie: Zadanie;
  pool: Pool;
  uznay: UznayPool;
  plan: SessiyaPlan;
  /** Хранилище решённых задач и хранилище «Узнай метод». */
  store: ProgressStore;
  uznayStore: ProgressStore;
  /** Куда ведёт кнопка возврата с итогового экрана. */
  backHref: string;
  /** Собрать новый подход с теми же настройками. */
  onAgain: () => void;
}

/** Название метода по идентификатору — для статистики итога. */
const NAZVANIYA: Record<string, string> = Object.fromEntries(METODY.map((m) => [m.id, m.nazvanie]));

/** Отпечатки всех методов — чтобы после ответа назвать верный. */
const OTPECHATKI = new Map<string, Method>(METODY.map((m) => [sealMetod(m.id), m.id]));

interface Itog {
  vybor: Method;
  verny: Method;
  priznaki: string[];
}

/**
 * Подход тренажёра заданий №4 и №5: задачи одна за другой, кружки
 * подхода и итог — те же, что у задания №12.
 *
 * В режимах отработки, смешанном и повторе ошибок задача — ProblemCard:
 * условие, рисунок по модели, решение по шагам; правильных ответов в
 * разметке нет. В режиме «Узнай метод» — только условие и кнопки
 * методов: метода в разметке тоже нет, кнопка сверяется с отпечатком,
 * а признаки открываются им же после ответа.
 *
 * Порядок подхода собирает хранилище в useRound после монтирования:
 * при отрисовке компонент ни часов, ни случайных чисел не спрашивает,
 * поэтому разметка сервера и первая отрисовка в браузере совпадают.
 */
export function Sessiya({
  zadanie,
  pool,
  uznay,
  plan,
  store,
  uznayStore,
  backHref,
  onAgain,
}: SessiyaProps) {
  const slova = trenazherSlova(zadanie);
  const uznayTeksty = uznaySlova(zadanie);
  const metody = metodyZadaniya(zadanie);
  const uznayRezhim = plan.rezhim === 'uznay';

  const round = useVeroyatnostRound(plan.key, plan.source, plan.size);
  const byId = useMemo(() => new Map(pool.kinds.map((kind) => [kind.id, kind])), [pool]);
  const uznayById = useMemo(() => new Map(uznay.kinds.map((kind) => [kind.id, kind])), [uznay]);

  const [index, setIndex] = useState(0);
  /* Чем закончилось каждое задание подхода: кружки и итог берут отсюда. */
  const [marks, setMarks] = useState<Record<number, TrainerMark>>({});
  /* Метод каждой задачи подхода — для статистики итога. В «Узнай
     метод» он становится известен только после ответа. */
  const [metodyZadach, setMetodyZadach] = useState<Record<number, Method>>({});
  const [misses, setMisses] = useState(0);
  const [result, setResult] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [itog, setItog] = useState<Itog | null>(null);

  const startedAt = useRef<number | null>(null);
  const nachalo = useRef(0);
  /* Задача закрывается один раз: первым ответом или открытым
     решением. Второй ответ после ошибки счётчиков не меняет. */
  const zakryto = useRef<string | null>(null);
  const oshibsya = useRef(false);
  useEffect(() => {
    nachalo.current = Date.now();
    oshibsya.current = false;
  }, [plan.key, index]);

  const item = round[index];
  const total = round.length;
  const last = index === total - 1;
  const id = item === undefined ? '' : zadachaId(item.kind, item.n);

  function otmetit(mark: TrainerMark | null, metod: Method) {
    if (mark !== null) {
      setMarks((was) => ({ ...was, [index]: mark }));
    }
    setMetodyZadach((was) => ({ ...was, [index]: metod }));
  }

  /* Время идёт от первой проверки: до неё ученик ещё читает условие. */
  function tik(vremya: number) {
    if (startedAt.current === null) {
      startedAt.current = vremya;
    }
    if (last) {
      setSeconds((vremya - startedAt.current) / 1000);
    }
  }

  /** Закрыть задачу тренажёра: верный ответ или открытое решение. */
  function zapisat(right: boolean, clean: boolean, vremya: number) {
    if (item === undefined || zakryto.current === id) {
      return;
    }
    const kind = byId.get(item.kind);
    const metod = kind === undefined ? undefined : metodKind(kind);
    if (metod === undefined) {
      return;
    }
    zakryto.current = id;
    store.recordAttempt({
      kind: metod,
      taskId: id,
      right,
      clean,
      seconds: (vremya - nachalo.current) / 1000,
    });
    otmetit(right ? 'right' : 'hinted', metod);
    tik(vremya);
  }

  function otvet(right: boolean, vremya: number) {
    if (right) {
      zapisat(true, !oshibsya.current, vremya);
      return;
    }
    oshibsya.current = true;
    setMisses((n) => n + 1);
    tik(vremya);
  }

  /** «Узнай метод»: сверить выбор с отпечатком и открыть признаки. */
  function vybrat(metod: Method, vremya: number) {
    const kind = item === undefined ? undefined : uznayById.get(item.kind);
    const variant = kind?.variants.find((v) => v.n === item?.n);
    if (item === undefined || variant === undefined || itog !== null) {
      return;
    }
    const verny = OTPECHATKI.get(variant.metodSeal);
    if (verny === undefined) {
      return;
    }
    const right = sealMetod(metod) === variant.metodSeal;
    const priznaki = JSON.parse(openText(variant.hints, variant.metodSeal)) as string[];
    setItog({ vybor: metod, verny, priznaki });
    uznayStore.recordAttempt({
      kind: verny,
      taskId: id,
      right,
      clean: right,
      seconds: (vremya - nachalo.current) / 1000,
    });
    if (!right) {
      setMisses((n) => n + 1);
    }
    otmetit(right ? 'right' : null, verny);
    tik(vremya);
  }

  function dalshe() {
    if (last) {
      setResult(true);
      return;
    }
    setIndex((n) => n + 1);
    setItog(null);
  }

  if (result) {
    return (
      <TrainerResult
        tasks={round.map((_, i) => ({ kind: metodyZadach[i] ?? plan.metod }))}
        marks={marks}
        misses={misses}
        seconds={seconds}
        backHref={backHref}
        onAgain={onAgain}
        kindTitle={NAZVANIYA}
      />
    );
  }

  if (item === undefined) {
    /* До монтирования подхода нет: показываем место под него,
       а не пустой экран, который тут же сменится задачей. */
    return <p className="vtrainer__wait">{slova.zhdem}</p>;
  }

  const kruzhki = (
    <>
      <p className="ttask__count">
        Задача <b>{index + 1}</b> из {total}
      </p>
      {/* Кружки — те же, что в подготовке: цвет говорит, что с задачей
          стало. Прыгать по подходу нельзя, поэтому ряд без ссылок. */}
      <PrepDots
        items={round.map((z, i) => ({
          id: `${i}-${z.kind}-${z.n}`,
          no: i + 1,
          state: marks[i] === 'right' ? 'right' : marks[i] === 'hinted' ? 'revealed' : null,
        }))}
        current={index}
      />
    </>
  );

  if (uznayRezhim) {
    const kind = uznayById.get(item.kind);
    const variant = kind?.variants.find((v) => v.n === item.n);
    if (kind === undefined || variant === undefined) {
      return null;
    }
    const verno = itog !== null && itog.vybor === itog.verny;
    return (
      <section className="ttask z4-uznay">
        {kruzhki}
        <div
          className={clsx(
            'z4-uznay__zadacha',
            itog !== null && (verno ? 'is-correct' : 'is-incorrect'),
          )}
        >
          <ProblemCard
            key={id}
            variant="condition"
            zadacha={{
              id,
              uslovie: variant.uslovie,
              seal: '',
              steps: '',
              ...(variant.illustration === undefined ? {} : { illustration: variant.illustration }),
            }}
            istochnik={uznayTeksty.istochnik[kind.istochnik]}
          />

          <p className="z4-uznay__vopros">{uznayTeksty.vopros}</p>
          <MethodPicker
            vybor={itog?.vybor ?? null}
            verny={itog?.verny ?? null}
            onPick={(metod) => vybrat(metod, seychas())}
            label={uznayTeksty.vopros}
            metody={metody}
          />

          {itog !== null ? (
            <div
              className={clsx(
                'z4-uznay__itog',
                verno ? 'z4-uznay__itog--correct' : 'z4-uznay__itog--incorrect',
              )}
              role="status"
            >
              <p className="z4-uznay__verdict">
                <span className="z4-uznay__ico">{verno ? <RightIcon /> : <WrongIcon />}</span>
                {verno ? uznayTeksty.verno : uznayTeksty.neverno}
              </p>
              {verno ? null : (
                <p className="z4-uznay__pravilnyy">
                  <b>{uznayTeksty.pravilnyy}</b> {metodPoId(itog.verny).nazvanie}
                </p>
              )}
              {/* Признаки — и после ошибки, и после верного ответа:
                  во втором случае это подкрепление, заголовок другой. */}
              <p className="z4-uznay__priznaki-title">
                {verno ? uznayTeksty.kakVidno : uznayTeksty.priznaki}
              </p>
              <ul className="z4-uznay__priznaki">
                {itog.priznaki.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
              <div className="z4-uznay__actions">
                <Button onClick={dalshe}>{last ? slova.zavershit : slova.dalshe}</Button>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    );
  }

  const kind = byId.get(item.kind);
  const variant = kind?.variants.find((v) => v.n === item.n);
  if (kind === undefined || variant === undefined) {
    return null;
  }
  const metod = metodKind(kind);

  return (
    <section className="ttask">
      {kruzhki}
      {/* Ключ — сама задача: следующая карточка начинается с чистого
          состояния, а не наследует введённый ответ. */}
      <ProblemCard
        key={id}
        zadacha={{
          id,
          uslovie: variant.uslovie,
          seal: variant.seal,
          steps: variant.steps,
          ...(variant.model === undefined ? {} : { model: variant.model }),
        }}
        /* Метод в шапке — только в отработке: в смешанном режиме и
           в повторе ученик должен узнать его сам. */
        {...(plan.rezhim === 'practice' && metod !== undefined
          ? { metodLabel: metodPoId(metod).nazvanie }
          : {})}
        istochnik={kind.istochnik}
        onResult={(right) => otvet(right, seychas())}
        onReveal={() => zapisat(false, false, seychas())}
        onNext={dalshe}
        nextLabel={last ? slova.zavershit : slova.dalshe}
      />
    </section>
  );
}
