'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ProblemCard } from '@/components/tasks/card';
import { PODGOTOVKA_SLOVA, type Zadanie } from '@/content/veroyatnost';
import { nextUnsolved, type TaskStatus } from '@/lib/prepOrder';
import { scrollTabTo } from '@/lib/tabScroll';
import { METODY } from '@/lib/veroyatnost/model';
import type { PrepPoolBlok, PrepPoolZadacha } from '@/lib/veroyatnost/pool';
import type { TaskOutcome } from '@/lib/progressStore';
import { recordPrepVeroyatnost } from '@/lib/progress';
import { prepItog, prepReshena, prepStore } from '@/lib/veroyatnost/prepProgress';
import { klyuchZadachi } from '@/lib/veroyatnost/secret';
import { RightIcon, WrongIcon } from '../prep/PrepIcons';
import { PrepDots, type PrepDotState } from '../prep/PrepDots';

export interface PodgotovkaBlokProps {
  zadanie: Zadanie;
  blok: PrepPoolBlok;
  /** Адрес списка блоков: туда ведёт кнопка с последней задачи. */
  listHref: string;
}

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
 * Цвет кружка переживает перезагрузку: хранилище подготовки помнит
 * не только решённое, но и чем закрылась каждая задача — ошибкой или
 * разобранным решением.
 *
 * Ответов в разметке нет ни у одной задачи: карточка сверяет ответ
 * с отпечатком, разбор раскрывается по нему же.
 */
export function PodgotovkaBlok({ zadanie, blok, listHref }: PodgotovkaBlokProps) {
  const store = prepStore(zadanie);
  const progress = store.useProgress();
  /* Пусто — задачу выбирает сам экран: первую нерешённую. Как только
     ученик перешёл по кружку, выбор закрепляется за ним. */
  const [vybrana, setVybrana] = useState<number | null>(null);

  const zadachi = blok.zadachi;
  const sostoyaniya: PrepDotState[] = zadachi.map((zadacha) => prepItog(progress, zadacha.id));
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

  /* В хранилище уходит номер задачи и её исход: ответа там нет.
     Времени подготовка не считает — это конспект, а не подход
     на скорость. */
  function zapisat(right: boolean, clean: boolean, itog: TaskOutcome): void {
    store.recordAttempt({ kind: zadacha.id, taskId: zadacha.id, right, clean, seconds: 0, itog });
    /* Единый журнал прогресса: пишется рядом, старую запись не
       заменяет (см. отчёт этапа 1). Навык — блок конспекта: это то,
       что ученик видит заголовком экрана, а не отдельная задача. */
    recordPrepVeroyatnost(zadanie, {
      skillId: blok.id,
      taskId: zadacha.id,
      verdict: right ? 'correct' : 'incorrect',
      hintUsed: itog === 'revealed',
      firstTry: clean,
    });
  }

  function otvet(right: boolean): void {
    setVybrana(index);
    /* Начисто — если до верного ответа задачу не открывали
       и не отвечали неверно. */
    zapisat(right, right && prepItog(progress, zadacha.id) === null, right ? 'right' : 'wrong');
  }

  function razbor(): void {
    setVybrana(index);
    /* Решённую задачу разбор не понижает: ученик перечитывает своё. */
    if (prepReshena(progress, zadacha.id)) {
      return;
    }
    zapisat(false, false, 'revealed');
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
            klyuch: klyuchZadachi(zadacha.id),
            seal: zadacha.seal,
            steps: zadacha.steps,
            ...(zadacha.model === undefined ? {} : { model: zadacha.model }),
            ...(zadacha.illustration === undefined ? {} : { illustration: zadacha.illustration }),
            ...(zadacha.risunok === undefined ? {} : { risunok: zadacha.risunok }),
          }}
          {...(metod === undefined ? {} : { metodLabel: metod.nazvanie })}
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
