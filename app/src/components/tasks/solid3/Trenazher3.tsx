'use client';

import { useMemo } from 'react';
import { Trenazher } from '@/components/trenazher/Trenazher';
import type { SsylkiTipa } from '@/components/trenazher/types';
import { randomSeed } from '@/lib/randomSeed';
import type { TrenPayload } from '@/lib/trenazher/sessiya';
import type { TrenazherConfig, ZadachaRef } from '@/lib/trenazher/types';
import { dataUrl } from '@/lib/dataUrl';
import type { Pool } from '@/lib/zadanie3/pool';
import { useZ3Progress } from '@/lib/zadanie3/progress';
import { isSolid3Payload } from '@/lib/zadanie3/session';
import { klyuch3 } from '@/lib/zadanie3/trenazher/filtry3';
import { kartochka3 } from './Zadacha3';

export interface Trenazher3Props {
  /** Конфиг фильтров и список задач — собраны на сборке (названия с формулами в KaTeX). */
  config: TrenazherConfig;
  refs: ZadachaRef[];
  backHref: string;
  /** Прототип → разбор типа: ссылка в итогах по типам с ошибками. */
  ssylki: Record<string, SsylkiTipa>;
}

/* Банк тренажёра — файл сборки (app/zadaniya/3/dannye/bank.json):
   один раз за визит, сбой сети не застревает в кеше. */
let bank: Promise<Pool> | null = null;
function zagruzitBank3(): Promise<Pool> {
  if (bank === null) {
    bank = fetch(dataUrl('/zadaniya/3/dannye/bank.json')).then((r) => {
      if (!r.ok) throw new Error(`bank.json: ${r.status}`);
      return r.json() as Promise<Pool>;
    });
    bank.catch(() => {
      bank = null;
    });
  }
  return bank;
}

/** «P03-01:3» из прогресса → ключ задачи «P03-01#3». */
function izProgressa(list: readonly string[]): Set<string> {
  return new Set(
    list.flatMap((item) => {
      const [id, n] = item.split(':');
      return id === undefined || n === undefined ? [] : [klyuch3(id, Number(n))];
    }),
  );
}

/**
 * Вкладка «Тренажёр» №3 на общей панели фильтров: разделы I–VIII —
 * темы, прототипы — чипы, открытый банк ФИПИ или нет. Разбор типа
 * ведёт сюда ссылкой ?tipy=P03-01,P03-02 — тренажёр открывается с
 * этими прототипами.
 */
export function Trenazher3({ config, refs, backHref, ssylki }: Trenazher3Props) {
  const kartochka = useMemo(() => kartochka3(zagruzitBank3), []);
  const klyuchi = useMemo(() => new Set(refs.map((r) => r.key)), [refs]);
  const progress = useZ3Progress();
  const stat = useMemo(
    () => ({ resheno: izProgressa(progress.solved), oshibki: izProgressa(progress.mistakes) }),
    [progress],
  );

  /* Незавершённая тренировка прежнего экрана: пул «прототип, вариант»
     целиком (с запасными вариантами) становится заданиями тренировки,
     а прежняя раскладка (order) показывает, какие из них на ленте. */
  function perenos(packed: unknown): TrenPayload | null {
    if (!isSolid3Payload(packed, (id, n) => klyuchi.has(klyuch3(id, n)))) return null;
    return {
      v: 1,
      filtr: '',
      rezhim: 'podskazki',
      seed: randomSeed(),
      items: packed.pool.map((item) => ({ k: klyuch3(item.kind, item.n) })),
    };
  }

  return (
    <Trenazher
      config={config}
      refs={refs}
      kartochka={kartochka}
      stat={stat}
      backHref={backHref}
      ssylki={ssylki}
      perenos={perenos}
    />
  );
}
