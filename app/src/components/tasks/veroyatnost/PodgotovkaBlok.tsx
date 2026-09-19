'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ProblemCard } from '@/components/tasks/card';
import { PODGOTOVKA_SLOVA, type Zadanie } from '@/content/veroyatnost';
import { nextUnsolved, type TaskStatus } from '@/lib/prepOrder';
import { scrollTabTo } from '@/lib/tabScroll';
import { METODY } from '@/lib/veroyatnost/model';
import type { PrepPoolBlok, PrepPoolZadacha } from '@/lib/veroyatnost/pool';
import { prepReshena, prepStore, prepTrudnaya } from '@/lib/veroyatnost/prepProgress';
import { RightIcon, WrongIcon } from '../prep/PrepIcons';
import { PrepDots, type PrepDotState } from '../prep/PrepDots';

export interface PodgotovkaBlokProps {
  zadanie: Zadanie;
  blok: PrepPoolBlok;
  /** Адрес списка блоков: туда ведёт кнопка с последней задачи. */
  listHref: string;
}

/** Что случилось с задачей в этой сессии и чего нет в хранилище. */
type Popytka = 'wrong' | 'revealed';

/* Экран открывается на первой нерешённой задаче: ученик продолжает,
   а не перерешивает сделанное. Решены все — открывается первая. */
function pervaya(status: readonly TaskStatus[]): number {
  const found = status.findIndex((item) => item !== 'right');
  return found === -1 ? 0 : found;
}

/**
 * Блок подготовительных задач заданий №4 и №5.
 *
 * Устроено как у задания №12: все задачи блока живут на одном экране,
 * смена задачи — это состояние, а не переход по адресу; ряд кружков
 * сверху показывает, что с какой задачей стало, и по кружку можно
 * перейти. Порядок внутри блока свободный, «дальше» ведёт к ближайшей
 * нерешённой; между блоками ученик ходит лентой сверху.
 *
 * Решённое переживает перезагрузку — оно в хранилище подготовки этого
 * задания. Ошибка и открытый разбор держатся до перезагрузки точно;
 * после неё видно только то, что задача бралась и своими силами
 * не закрыта.
 *
 * Ответов в разметке нет ни у одной задачи: карточка сверяет ответ
 * с отпечатком, разбор раскрывается по нему же.
 */
export function PodgotovkaBlok({ zadanie, blok, listHref }: PodgotovkaBlokProps) {
  const store = prepStore(zadanie);
  const progress = store.useProgress();
  const [popytki, setPopytki] = useState<Record<string, Popytka>>({});
  /* Пусто — задачу выбирает сам экран: первую нерешённую. Как только
     ученик перешёл по кружку, выбор закрепляется за ним. */
  const [vybrana, setVybrana] = useState<number | null>(null);

  const zadachi = blok.zadachi;
  const sostoyaniya: PrepDotState[] = zadachi.map((zadacha) =>
    prepReshena(progress, zadacha.id)
      ? 'right'
      : (popytki[zadacha.id] ?? (prepTrudnaya(progress, zadacha.id) ? 'revealed' : null)),
  );
  /* Для обхода важно одно: решена задача или нет. */
  const status: TaskStatus[] = sostoyaniya.map((item) => (item === 'right' ? 'right' : null));

  const index = vybrana ?? pervaya(status);
  const found = zadachi[index];
  if (found === undefined) {
    /* Пустых блоков в конспекте нет, но обращение по индексу
       в TypeScript честно необязательно. */
    return null;
  }
  /* Отдельная запись с объявленным типом: обработчики ниже —
     замыкания, а в них проверка выше уже не видна. */
  const zadacha: PrepPoolZadacha = found;

  const verno = sostoyaniya.filter((item) => item === 'right').length;
  const neverno = sostoyaniya.filter((item) => item === 'wrong').length;
  const dalshe = nextUnsolved(status, index);
  const metod = METODY.find((m) => m.id === zadacha.model?.method);

  function otkryt(nomer: number): void {
    setVybrana(nomer);
    /* На телефоне условие следующей задачи оказывается ниже кромки
       экрана: подводим его к глазам, а не заставляем искать. */
    scrollTabTo('.vprep__zadacha');
  }

  /* В хранилище уходит номер задачи и то, закрыта ли она начисто:
     ответа там нет. Времени подготовка не считает — это конспект,
     а не подход на скорость. */
  function zapisat(id: string, right: boolean, clean: boolean): void {
    store.recordAttempt({ kind: id, taskId: id, right, clean, seconds: 0 });
  }

  function otvet(right: boolean): void {
    setVybrana(index);
    if (right) {
      /* Начисто — если до верного ответа не было ни ошибки,
         ни открытого разбора. */
      zapisat(zadacha.id, true, popytki[zadacha.id] === undefined);
      return;
    }
    setPopytki((was) => ({ ...was, [zadacha.id]: 'wrong' }));
    zapisat(zadacha.id, false, false);
  }

  function razbor(): void {
    setVybrana(index);
    setPopytki((was) => ({ ...was, [zadacha.id]: 'revealed' }));
    zapisat(zadacha.id, false, false);
  }

  return (
    <section className="ptask vprep">
      <header className="ptask__head">
        <h3 className="ptask__title">{blok.nazvanie}</h3>
        <p className="ptask__score">
          <span className="ptask__score-item ptask__score-item--right">
            <RightIcon />
            <span className="ptask__score-num">{verno}</span>
            <span className="sr-only">{PODGOTOVKA_SLOVA.verno}</span>
          </span>
          <span className="ptask__score-item ptask__score-item--wrong">
            <WrongIcon />
            <span className="ptask__score-num">{neverno}</span>
            <span className="sr-only">{PODGOTOVKA_SLOVA.neverno}</span>
          </span>
        </p>
      </header>

      <p className="ptask__counter">{PODGOTOVKA_SLOVA.schet(index + 1, zadachi.length)}</p>

      <PrepDots
        items={zadachi.map((item, i) => ({
          id: item.id,
          no: item.nomer,
          state: sostoyaniya[i] ?? null,
        }))}
        current={index}
        onPick={otkryt}
        label={PODGOTOVKA_SLOVA.ryad}
      />

      <div className="vprep__zadacha">
        <ProblemCard
          key={zadacha.id}
          zadacha={{
            id: zadacha.id,
            uslovie: zadacha.uslovie,
            seal: zadacha.seal,
            steps: zadacha.steps,
            ...(zadacha.model === undefined ? {} : { model: zadacha.model }),
            ...(zadacha.illustration === undefined ? {} : { illustration: zadacha.illustration }),
            ...(zadacha.risunok === undefined ? {} : { risunok: zadacha.risunok }),
          }}
          nomer={zadacha.nomer}
          {...(metod === undefined ? {} : { metodLabel: metod.nazvanie })}
          istochnik={PODGOTOVKA_SLOVA.istochnik}
          onResult={otvet}
          onReveal={razbor}
          {...(dalshe === null
            ? {}
            : {
                onNext: () => otkryt(dalshe),
                nextLabel:
                  dalshe === index + 1
                    ? PODGOTOVKA_SLOVA.dalshe
                    : PODGOTOVKA_SLOVA.dalsheNereshennaya,
              })}
        />
      </div>

      {dalshe === null ? (
        /* Нерешённых в блоке не осталось — идти внутри него некуда. */
        <p className="vprep__gotovo">
          <Link className="btn btn--primary" href={listHref}>
            {PODGOTOVKA_SLOVA.kSpisku}
          </Link>
        </p>
      ) : null}
    </section>
  );
}
