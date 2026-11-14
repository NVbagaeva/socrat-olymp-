'use client';

import { useEffect, useState } from 'react';
import type { Zadanie } from '@/content/veroyatnost';
import { ZADANIYA } from '@/lib/paths';
import type { RazboryVida } from '@/lib/veroyatnost/pool';
import type { SessiyaZadacha } from './sessiyaPayload';

/**
 * Закрытые разборы и подсказки задач тренировки — по требованию.
 *
 * Страница тренажёра несёт банк без них (pool.ts, bezRazborov): целиком
 * зашифрованные разборы весят мегабайты и почти не сжимаются, и вкладка
 * грузилась бы долго. Здесь они догружаются файлами сборки по
 * прототипам (app/zadaniya/{4,5}/dannye/razbory/) — только те, что
 * попали в подход, и один раз за визит: сбой сети в кеше не застревает.
 */

const KESH = new Map<string, Promise<RazboryVida>>();

function zagruzitVid(zadanie: Zadanie, kind: string, versiya: string): Promise<RazboryVida> {
  const klyuch = `${zadanie}:${kind}:${versiya}`;
  let p = KESH.get(klyuch);
  if (p === undefined) {
    p = fetch(`${ZADANIYA}/${zadanie}/dannye/razbory/${kind}.json?v=${versiya}`).then((r) => {
      if (!r.ok) {
        throw new Error(`razbory ${kind}: ${r.status}`);
      }
      return r.json() as Promise<RazboryVida>;
    });
    p.catch(() => {
      KESH.delete(klyuch);
    });
    KESH.set(klyuch, p);
  }
  return p;
}

/** Нужен ли задаче разбор с сервера: у «Узнай метод» его нет вовсе. */
function nuzhenRazbor(task: SessiyaZadacha): boolean {
  return task.steps === '' && task.seal !== '';
}

/** Задачи с разборами и подсказками из файлов сборки. */
export async function sRazborami(
  tasks: readonly SessiyaZadacha[],
  zadanie: Zadanie,
  versiya: string,
): Promise<SessiyaZadacha[]> {
  const vidy = [...new Set(tasks.filter(nuzhenRazbor).map((t) => t.kind))];
  const razbory = new Map(
    await Promise.all(
      vidy.map(async (kind) => [kind, await zagruzitVid(zadanie, kind, versiya)] as const),
    ),
  );
  return tasks.map((task) => {
    if (!nuzhenRazbor(task)) {
      return task;
    }
    const r = razbory.get(task.kind)?.[String(task.n)];
    if (r === undefined) {
      throw new Error(`Нет разбора ${task.id}`);
    }
    return {
      ...task,
      steps: r.steps,
      ...(r.podskazka === undefined ? {} : { podskazka: r.podskazka }),
    };
  });
}

/** Состояние загрузки: задачи готовы, ещё грузятся или не загрузились. */
export type Zagruzka<T> = { gotovo: T } | 'zagruzka' | 'oshibka';

/**
 * Задачи с разборами для экрана. Пока файлы грузятся — «zagruzka»;
 * «povtorit» запускает загрузку заново после сбоя сети.
 */
export function useSRazborami(
  tasks: readonly SessiyaZadacha[],
  zadanie: Zadanie,
  versiya: string,
): { sostoyanie: Zagruzka<SessiyaZadacha[]>; povtorit: () => void } {
  const [popytka, setPopytka] = useState(0);
  const [sostoyanie, setSostoyanie] = useState<{
    tasks: readonly SessiyaZadacha[];
    popytka: number;
    znachenie: Zagruzka<SessiyaZadacha[]>;
  } | null>(null);

  useEffect(() => {
    let alive = true;
    sRazborami(tasks, zadanie, versiya).then(
      (gotovo) => {
        if (alive) setSostoyanie({ tasks, popytka, znachenie: { gotovo } });
      },
      () => {
        if (alive) setSostoyanie({ tasks, popytka, znachenie: 'oshibka' });
      },
    );
    return () => {
      alive = false;
    };
  }, [tasks, zadanie, versiya, popytka]);

  const aktualno =
    sostoyanie !== null && sostoyanie.tasks === tasks && sostoyanie.popytka === popytka;
  return {
    sostoyanie: aktualno ? sostoyanie.znachenie : 'zagruzka',
    povtorit: () => setPopytka((x) => x + 1),
  };
}
