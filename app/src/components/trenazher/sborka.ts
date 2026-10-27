'use client';

import { useEffect, useState } from 'react';
import type { TrenPayload } from '@/lib/trenazher/sessiya';
import type { KartochkaRazdela, Postroitel } from './types';

/*
 * Сборка задач тренировки по требованию. Движок раздела грузится один
 * раз на карточку, задача собирается, когда её открыли, и кладётся в
 * кэш тренировки: вернувшись к ней по ленте, ученик видит ту же задачу,
 * а итоги берут условие оттуда же.
 */

const DVIZHKI = new WeakMap<object, Promise<Postroitel<unknown>>>();
const GOTOVYE = new WeakMap<object, Postroitel<unknown>>();
const KESH = new WeakMap<TrenPayload, Map<string, unknown>>();

function dvizhok<T>(K: KartochkaRazdela<T>): Promise<Postroitel<T>> {
  let p = DVIZHKI.get(K) as Promise<Postroitel<T>> | undefined;
  if (p === undefined) {
    p = K.zagruzit().then((d) => {
      GOTOVYE.set(K, d as Postroitel<unknown>);
      return d;
    });
    DVIZHKI.set(K, p as Promise<Postroitel<unknown>>);
  }
  return p;
}

/**
 * Задача тренировки, если движок уже загружен. undefined — ещё нет
 * (или движок не загружен); null — задача не собралась.
 */
export function zadachaIzKesha<T>(
  K: KartochkaRazdela<T>,
  payload: TrenPayload,
  at: number,
  pohozhaya: number,
): T | null | undefined {
  const d = GOTOVYE.get(K) as Postroitel<T> | undefined;
  if (d === undefined) return undefined;
  let kesh = KESH.get(payload);
  if (kesh === undefined) {
    kesh = new Map();
    KESH.set(payload, kesh);
  }
  const key = `${at}:${pohozhaya}`;
  if (!kesh.has(key)) {
    let task: T | null;
    try {
      task = d.postroit(payload, at, pohozhaya);
    } catch {
      task = null;
    }
    kesh.set(key, task);
  }
  return kesh.get(key) as T | null;
}

/** Задача на экране: пока движок грузится — undefined. */
export function useZadacha<T>(
  K: KartochkaRazdela<T>,
  payload: TrenPayload,
  at: number,
  pohozhaya: number,
): T | null | undefined {
  const [ready, setReady] = useState(() => GOTOVYE.has(K));
  useEffect(() => {
    if (ready) return undefined;
    let alive = true;
    void dvizhok(K).then(
      () => {
        if (alive) setReady(true);
      },
      () => undefined,
    );
    return () => {
      alive = false;
    };
  }, [K, ready]);
  return ready ? zadachaIzKesha(K, payload, at, pohozhaya) : undefined;
}

/** Загрузить движок заранее: «Начать тренировку» ждёт его, а не первая задача. */
export function zagruzitDvizhok<T>(K: KartochkaRazdela<T>): Promise<Postroitel<T>> {
  return dvizhok(K);
}

/** Последние состояния задач тренировки: итогам нужны время и номер «похожей». */
export const SOSTOYANIYA = new WeakMap<
  TrenPayload,
  Record<number, { pohozhaya: number; sek: number }>
>();
