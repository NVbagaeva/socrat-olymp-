'use client';

import { useMemo, useRef } from 'react';
import { TrainerSessionHost } from '@/components/tasks/session';
import { REZHIMY, type Rezhim, type Zadanie } from '@/content/veroyatnost';
import { createProgressStore, type ProgressStore } from '@/lib/progressStore';
import { scopeOfPath } from '@/lib/trainerSession/scope';
import type { IndeksPool, IndeksUznay } from '@/lib/veroyatnost/dannye45';
import { poolIz, PUSTOY_POOL, PUSTOY_UZNAY, uznayIz } from '@/lib/veroyatnost/zagruzka45';
import { sealMetod } from '@/lib/veroyatnost/secret';
import { sobratPodhod, type RoundItem, type RoundKind } from '@/lib/veroyatnost/useRound';
import { navykKind, navykiZadaniya, zadachaId } from './metody';
import type { MetodKarta } from './navyki';
import { ProgressPoMetodam } from './ProgressPoMetodam';
import { Sessiya } from './Sessiya';
import { SessiyaRazbor, UznayRazbor } from './SessiyaRazbor';
import {
  isSessiyaPayload,
  pohozhieIzSsylok,
  pohozhieSsylki,
  raspakovat,
  ssylkiZapisi,
  upakovat,
  zadachiPodhoda,
  type SessiyaPayload,
} from './sessiyaPayload';
import { readSessiyaUi, type SessiyaUi } from './sessiyaUi';
import {
  TrenazherKonfigurator,
  type RezhimPlitka,
  type TrenazherPreset,
  type TrenazherZapros,
} from './TrenazherKonfigurator';

export interface TrenazherProps {
  /**
   * Оглавление банка: прототипы и номера вариантов. Сами варианты
   * (условие, отпечаток ответа, закрытый разбор) загружаются файлами,
   * когда попадают в подход (lib/veroyatnost/dannye45.ts).
   */
  pool: IndeksPool;
  /** Оглавление «Узнай метод»: варианты — тоже файлами. */
  uznay: IndeksUznay;
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
 * отдаёт его оболочке сессии (components/tasks/session): она ведёт
 * таймер и паузу, показывает итоги и возвращает ученика в
 * незавершённую тренировку. Задачи подхода загружаются файлами в момент
 * старта — только те, что в него попали. В хранилище они лежат ссылками
 * на банк с контрольной подписью (sessiyaPayload.ts) и при возвращении
 * загружаются и собираются заново. Прогресс
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
  /* Название навыка по идентификатору и отпечатки навыков «Узнай метод». */
  const nazvaniya = useMemo(
    () =>
      Object.fromEntries(spisokMetodov.map((m) => [m.id, m.nazvanie])) as Record<string, string>,
    [spisokMetodov],
  );
  const otpechatki = useMemo(
    () => new Map(spisokMetodov.map((m) => [sealMetod(m.id), m.id])),
    [spisokMetodov],
  );

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

  /** Банк из вариантов подхода: загружается только нужный набор. */
  async function zagruzit(rezhim: Rezhim, ssylki: readonly RoundItem[]) {
    return rezhim === 'uznay'
      ? { p: PUSTOY_POOL(pool), u: await uznayIz(zadanie, uznay, ssylki) }
      : { p: await poolIz(zadanie, pool, ssylki), u: PUSTOY_UZNAY };
  }

  /* Пока загружаются задачи подхода, повторное нажатие «Начать» не считается. */
  const zapuskaetsya = useRef(false);

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

  /**
   * Собрать подход, загрузить его задачи и отдать оболочке сессии;
   * пустой — не начинать. Не загрузилось (нет сети) — тренировка не
   * начинается, кнопка снова доступна.
   */
  async function start(zapros: TrenazherZapros, begin: (payload: SessiyaPayload) => void) {
    if (zapuskaetsya.current) {
      return;
    }
    const source = istochnik(zapros.rezhim, zapros.metody);
    if (source.length === 0) {
      return;
    }
    const round = sobratPodhod(source, zapros.count);
    zapuskaetsya.current = true;
    let tasks;
    try {
      const { p, u } = await zagruzit(zapros.rezhim, round);
      tasks = zadachiPodhoda(round, zapros.rezhim, p, u);
    } catch (error) {
      console.error('Задачи тренировки не загрузились', error);
      return;
    } finally {
      zapuskaetsya.current = false;
    }
    if (tasks.length === 0) {
      return;
    }
    begin({
      zadanie,
      rezhim: zapros.rezhim,
      metod: zapros.metody[0] ?? '',
      podskazki: zapros.podskazki,
      tasks,
    });
  }

  return (
    <TrainerSessionHost<SessiyaPayload, SessiyaUi>
      /* Ярлык режима — вход по ссылке: при незавершённой тренировке вопрос. */
      entryIntent={preset !== null}
      /* Раздел вкладок считает тот же scopeOfPath от адреса вкладки. */
      scope={scopeOfPath(base) ?? String(zadanie)}
      what="тренажёр"
      backHref={base}
      isPayload={isSessiyaPayload}
      pack={upakovat}
      unpack={async (packed) => {
        const zapis = ssylkiZapisi(packed);
        if (zapis === null) {
          return null;
        }
        const { p, u } = await zagruzit(zapis.rezhim, zapis.ssylki);
        return raspakovat(packed, p, u);
      }}
      count={(payload) => payload.tasks.length}
      describe={(payload, at) => {
        const task = payload.tasks[at];
        if (task === undefined) {
          throw new Error('Нет задачи');
        }
        if (payload.rezhim === 'uznay') {
          const verny = otpechatki.get(task.metodSeal) ?? '';
          return {
            kind: nazvaniya[verny] ?? payload.metod,
            html: task.uslovie,
            review: () => <UznayRazbor task={task} zadanie={payload.zadanie} verny={verny} />,
          };
        }
        return {
          kind: nazvaniya[task.metod] ?? payload.metod,
          html: task.uslovie,
          review: () => <SessiyaRazbor task={task} />,
        };
      }}
      subset={(payload, indexes) => ({
        ...payload,
        tasks: indexes.flatMap((at) => payload.tasks[at] ?? []),
      })}
      similar={async (payload, indexes) => {
        const ssylki = pohozhieSsylki(
          payload,
          indexes,
          payload.rezhim === 'uznay' ? uznay.kinds : pool.kinds,
        );
        if (ssylki.length === 0) {
          return null;
        }
        const { p, u } = await zagruzit(payload.rezhim, ssylki);
        return pohozhieIzSsylok(payload, ssylki, p, u);
      }}
      configurator={(api) => (
        <TrenazherKonfigurator
          zadanie={zadanie}
          metody={metody}
          rezhimy={rezhimy}
          tally={progress.kinds}
          preset={preset}
          sekundNaZadachu={sekundNaZadachu}
          onStart={(zapros) => void start(zapros, api.start)}
          stats={
            <ProgressPoMetodam
              zadanie={zadanie}
              store={store}
              uznayStore={uznayStore}
              metody={spisokMetodov}
            />
          }
        />
      )}
      screen={({ payload, restored, report, elapsed, finish }) => (
        <Sessiya
          payload={payload}
          restored={restored === null ? null : readSessiyaUi(restored)}
          report={report}
          elapsed={elapsed}
          onFinish={finish}
          store={store}
          uznayStore={uznayStore}
        />
      )}
    />
  );
}
