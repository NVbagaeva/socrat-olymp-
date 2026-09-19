'use client';

import { useState } from 'react';
import type { SkillItem } from '@/components/tasks/configurator';
import {
  TrainerConfigurator,
  type ConfiguratorPreset,
  type TrainerModeOption,
  type TrainerRequest,
} from '@/components/tasks/trainer';
import {
  KONFIGURATOR_SLOVA,
  REZHIMY,
  trenazherSlova,
  uznaySlova,
  type Rezhim,
  type Zadanie,
} from '@/content/veroyatnost';
import { createProgressStore, type ProgressStore } from '@/lib/progressStore';
import type { Method } from '@/lib/veroyatnost/model';
import type { Pool, UznayPool } from '@/lib/veroyatnost/pool';
import type { RoundKind } from '@/lib/veroyatnost/useRound';
import { metodKind, metodyZadaniya, seychas, zadachaId } from './metody';
import { ProgressMetody } from './ProgressMetody';
import { Sessiya, type SessiyaPlan } from './Sessiya';

export interface TrenazherProps {
  pool: Pool;
  /** Задачи режима «Узнай метод»: только условия и отпечатки методов. */
  uznay: UznayPool;
  /** Чей тренажёр: у №4 пять методов, у №5 шесть; хранилища разные. */
  zadanie: Zadanie;
  /** Адрес вкладки: туда ведёт кнопка возврата с итогового экрана. */
  base: string;
  /** Название темы: в подзаголовке, бейдже и сводке. */
  family: string;
  /** Карточки методов, собранные на сервере (navyki.tsx). */
  skills: SkillItem[];
  /** Что выбрано при заходе по ярлыку адреса. */
  preset?: ConfiguratorPreset<Rezhim> | null;
}

/**
 * Тренажёр заданий №4 и №5 — раздел 07 референса на конфигураторе
 * задания №12.
 *
 * Конфигуратор тот же, что у №12 (TrainerConfigurator): метод вместо
 * навыка, четыре режима — «Отработка» (один метод), «Смешанная» (все
 * методы, названия метода в шапке карточки нет), «Повтор ошибок»
 * (задачи, где ответ не сошёлся или было открыто решение) и «Узнай
 * метод» (только условие и кнопки методов, считать не нужно), —
 * и количество задач. Уровней сложности у задач вероятности нет.
 *
 * «Начать тренировку» собирает подход из банка тут же, в браузере, и
 * экран задачи (Sessiya) встаёт на место конфигуратора. Прогресс
 * считается отдельно по каждому методу и живёт в своих хранилищах:
 * у каждого задания своё, у «Узнай метод» — своё, сброс здесь не
 * трогает ни задание №12, ни соседнее задание.
 */

/** Свои хранилища: ключ с номером задания и версией формата. */
const STORES: Record<Zadanie, ProgressStore> = {
  4: createProgressStore('budetege:veroyatnost-4:v1'),
  5: createProgressStore('budetege:veroyatnost-5:v1'),
};

const UZNAY_STORES: Record<Zadanie, ProgressStore> = {
  4: createProgressStore('budetege:veroyatnost-4-uznay:v1'),
  5: createProgressStore('budetege:veroyatnost-5-uznay:v1'),
};

function vsegoVariantov(kinds: readonly { variants: readonly unknown[] }[]): number {
  return kinds.reduce((sum, kind) => sum + kind.variants.length, 0);
}

export function Trenazher({
  pool,
  uznay,
  zadanie,
  base,
  family,
  skills,
  preset = null,
}: TrenazherProps) {
  const store = STORES[zadanie];
  const uznayStore = UZNAY_STORES[zadanie];
  const progress = store.useProgress();
  const slova = trenazherSlova(zadanie);
  const metody = metodyZadaniya(zadanie);
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

  /* «Все» в режиме на всё задание — сколько задач в нём на самом деле. */
  const modes: TrainerModeOption<Rezhim>[] = REZHIMY.map((item) => {
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
        return item;
    }
  });

  function istochnik(rezhim: Rezhim, metod: Method): RoundKind[] {
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
          .filter((kind) => rezhim === 'mixed' || metodKind(kind) === metod)
          .map((kind) => ({ id: kind.id, variants: kind.variants.map((v) => ({ n: v.n })) }));
    }
  }

  function start(request: TrainerRequest<Rezhim>) {
    const metod = request.skill.id as Method;
    const source = istochnik(request.mode, metod);
    if (source.length === 0) {
      return;
    }
    /* Ключ подхода новый на каждый запуск: подход не переиспользует
       прошлую раскладку. */
    setPlan({
      key: `v${zadanie}:${request.mode}:${seychas()}`,
      rezhim: request.mode,
      metod,
      source,
      size: request.count,
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
    <TrainerConfigurator
      family={family}
      skills={skills}
      modes={modes}
      preset={preset}
      levels={[]}
      words={KONFIGURATOR_SLOVA}
      onStart={start}
      stats={
        <>
          <ProgressMetody store={store} slova={slova.progress} metody={metody} />
          <ProgressMetody store={uznayStore} slova={uznaySlova(zadanie).progress} metody={metody} />
        </>
      }
    />
  );
}
