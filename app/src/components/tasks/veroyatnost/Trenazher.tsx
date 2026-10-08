'use client';

import { useState } from 'react';
import { REZHIMY, type Rezhim, type Zadanie } from '@/content/veroyatnost';
import { createProgressStore, type ProgressStore } from '@/lib/progressStore';
import type { Pool, UznayPool } from '@/lib/veroyatnost/pool';
import type { RoundKind } from '@/lib/veroyatnost/useRound';
import { navykKind, navykiZadaniya, seychas, zadachaId } from './metody';
import type { MetodKarta } from './navyki';
import { ProgressPoMetodam } from './ProgressPoMetodam';
import { Sessiya, type SessiyaPlan } from './Sessiya';
import {
  TrenazherKonfigurator,
  type RezhimPlitka,
  type TrenazherPreset,
  type TrenazherZapros,
} from './TrenazherKonfigurator';

export interface TrenazherProps {
  pool: Pool;
  /** Задачи режима «Узнай метод»: только условия и отпечатки методов. */
  uznay: UznayPool;
  /** Чей тренажёр: у №4 семь разделов, у №5 десять методов; хранилища разные. */
  zadanie: Zadanie;
  /** Адрес вкладки: туда ведёт кнопка возврата с итогового экрана. */
  base: string;
  /** Карточки методов, собранные на сервере (navyki.tsx). */
  metody: MetodKarta[];
  /** Что выбрано при заходе по ярлыку адреса. */
  preset?: TrenazherPreset | null;
}

/**
 * Тренажёр заданий №4 и №5 — по макету trenazher.png.
 *
 * Конфигуратор свой (TrenazherKonfigurator): карточки методов со
 * значками, четыре режима — «Отработка» (выбранные методы),
 * «Вперемешку» (все методы, названия метода в шапке карточки нет),
 * «Повтор ошибок» (задачи, где ответ не сошёлся или было открыто
 * решение) и «Узнай метод» (только условие и кнопки методов), —
 * количество задач и переключатель подсказок.
 *
 * «Начать тренировку» собирает подход из банка тут же, в браузере, и
 * экран задачи (Sessiya) встаёт на место конфигуратора. Прогресс
 * считается отдельно по каждому методу и живёт в своих хранилищах:
 * у каждого задания своё, у «Узнай метод» — своё, сброс здесь не
 * трогает ни задание №12, ни соседнее задание.
 */

/**
 * Свои хранилища: ключ с номером задания и версией формата. Версия
 * v2 у обоих заданий: прогресс считается по методам автора, а в v1
 * лежали ключи методов рисунка, и складывать их некуда.
 */
const STORES: Record<Zadanie, ProgressStore> = {
  4: createProgressStore('budetege:veroyatnost-4:v2'),
  5: createProgressStore('budetege:veroyatnost-5:v2'),
};

const UZNAY_STORES: Record<Zadanie, ProgressStore> = {
  4: createProgressStore('budetege:veroyatnost-4-uznay:v2'),
  5: createProgressStore('budetege:veroyatnost-5-uznay:v2'),
};

/* Пока статистики нет, задача считается за полторы минуты: столько
   в среднем уходит на задачу №4 с проверкой ответа. */
const SEKUND_NA_ZADACHU = 90;

function vsegoVariantov(kinds: readonly { variants: readonly unknown[] }[]): number {
  return kinds.reduce((sum, kind) => sum + kind.variants.length, 0);
}

export function Trenazher({ pool, uznay, zadanie, base, metody, preset = null }: TrenazherProps) {
  const store = STORES[zadanie];
  const uznayStore = UZNAY_STORES[zadanie];
  const progress = store.useProgress();
  const spisokMetodov = navykiZadaniya(zadanie);
  const [plan, setPlan] = useState<SessiyaPlan | null>(null);

  /* Ошибки — только те, что есть в банке: прототип могли переименовать. */
  const oshibki = new Set(progress.mistakes);
  const oshibochnye: RoundKind[] = pool.kinds
    .map((kind) => ({
      id: kind.id,
      variants: kind.variants
        .filter((v) => oshibki.has(zadachaId(kind.id, v.n)))
        .map((v) => ({ n: v.n })),
    }))
    .filter((kind) => kind.variants.length > 0);

  /* Сколько задач в каждом режиме на самом деле. */
  const rezhimy: RezhimPlitka[] = REZHIMY.map((item) => {
    switch (item.id) {
      case 'mixed':
        return { ...item, total: vsegoVariantov(pool.kinds) };
      case 'mistakes':
        return {
          ...item,
          total: vsegoVariantov(oshibochnye),
          locked: oshibochnye.length === 0,
        };
      case 'uznay':
        return { ...item, total: vsegoVariantov(uznay.kinds) };
      default:
        return { ...item, total: vsegoVariantov(pool.kinds) };
    }
  });

  /* Средняя длительность закрытой задачи — по хранилищу тренажёра. */
  const zakryto = Object.values(progress.kinds).reduce((sum, t) => sum + t.done, 0);
  const sekund = Object.values(progress.kinds).reduce((sum, t) => sum + t.seconds, 0);
  const sekundNaZadachu = zakryto >= 5 && sekund > 0 ? sekund / zakryto : SEKUND_NA_ZADACHU;

  function istochnik(rezhim: Rezhim, vybrannye: string[]): RoundKind[] {
    switch (rezhim) {
      case 'mistakes':
        return oshibochnye;
      case 'uznay':
        return uznay.kinds.map((kind) => ({
          id: kind.id,
          variants: kind.variants.map((v) => ({ n: v.n })),
        }));
      default:
        return pool.kinds
          .filter((kind) => rezhim === 'mixed' || vybrannye.includes(navykKind(kind)))
          .map((kind) => ({ id: kind.id, variants: kind.variants.map((v) => ({ n: v.n })) }));
    }
  }

  function start(zapros: TrenazherZapros) {
    const source = istochnik(zapros.rezhim, zapros.metody);
    if (source.length === 0) {
      return;
    }
    /* Ключ подхода новый на каждый запуск: подход не переиспользует
       прошлую раскладку. */
    setPlan({
      key: `v${zadanie}:${zapros.rezhim}:${seychas()}`,
      rezhim: zapros.rezhim,
      metod: zapros.metody[0] ?? '',
      source,
      size: zapros.count,
      podskazki: zapros.podskazki,
    });
  }

  if (plan !== null) {
    return (
      <Sessiya
        zadanie={zadanie}
        pool={pool}
        uznay={uznay}
        plan={plan}
        store={store}
        uznayStore={uznayStore}
        backHref={base}
        onAgain={() => setPlan({ ...plan, key: `v${zadanie}:${plan.rezhim}:${seychas()}` })}
      />
    );
  }

  return (
    <TrenazherKonfigurator
      zadanie={zadanie}
      metody={metody}
      rezhimy={rezhimy}
      tally={progress.kinds}
      preset={preset}
      sekundNaZadachu={sekundNaZadachu}
      onStart={start}
      stats={
        <ProgressPoMetodam
          zadanie={zadanie}
          store={store}
          uznayStore={uznayStore}
          metody={spisokMetodov}
        />
      }
    />
  );
}
