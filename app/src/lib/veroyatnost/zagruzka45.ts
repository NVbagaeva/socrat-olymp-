/**
 * Догрузка вариантов №4 и №5 в браузере (устройство — dannye45.ts).
 *
 * На вход — оглавление и список задач «прототип + номер варианта»;
 * на выход — банк того же вида, что раньше приходил в пропсах
 * (Pool, UznayPool), но только из нужных вариантов. Функции выбора
 * и сборки задач (sessiyaPayload.ts, sheet4.ts) работают с ним без
 * изменений.
 *
 * Файл загружается один раз за визит. Неудачный запрос из памяти
 * убирается: следующая попытка пойдёт в сеть заново.
 */

import { fingerprint } from '@/lib/secret';
import {
  adresVarianta,
  SOL_USLOVIYA,
  type IndeksLista,
  type IndeksPool,
  type IndeksUznay,
  type IndeksVarianta,
  type Nabor45,
} from './dannye45';
import type { Pool, PoolKind, PoolVariant, UznayPool, UznayVariant } from './pool';

/** Задача банка: прототип и номер варианта. */
export interface Ssylka45 {
  kind: string;
  n: number;
}

const kesh = new Map<string, Promise<unknown>>();

function zagruzit(adres: string): Promise<unknown> {
  let zapros = kesh.get(adres);
  if (zapros === undefined) {
    zapros = fetch(adres).then((r) => {
      if (!r.ok) {
        throw new Error(`${adres}: ${r.status}`);
      }
      return r.json() as Promise<unknown>;
    });
    zapros.catch(() => kesh.delete(adres));
    kesh.set(adres, zapros);
  }
  return zapros;
}

function klyuch(kind: string, n: number): string {
  return `${kind}#${n}`;
}

/**
 * Загрузить варианты набора. Задачи, которой нет в оглавлении,
 * пропускаются: так банк страницы и раньше молча не находил задачу.
 */
async function zagruzitVarianty<V>(
  zadanie: 4 | 5,
  nabor: Nabor45,
  kinds: readonly { id: string; variants: readonly IndeksVarianta[] }[],
  ssylki: readonly Ssylka45[],
): Promise<Map<string, V>> {
  const nuzhno = new Map<string, Ssylka45 & { variant: IndeksVarianta }>();
  for (const s of ssylki) {
    const variant = kinds.find((k) => k.id === s.kind)?.variants.find((v) => v.n === s.n);
    if (variant !== undefined) {
      nuzhno.set(klyuch(s.kind, s.n), { ...s, variant });
    }
  }
  const gotovo = await Promise.all(
    [...nuzhno.entries()].map(async ([k, s]) => {
      const dannye = await zagruzit(adresVarianta(zadanie, nabor, s.kind, s.variant));
      return [k, dannye as V] as const;
    }),
  );
  return new Map(gotovo);
}

/** Банк отработки из нужных вариантов: порядок прототипов и вариантов — как в оглавлении. */
export async function poolIz(
  zadanie: 4 | 5,
  indeks: IndeksPool,
  ssylki: readonly Ssylka45[],
): Promise<Pool> {
  const est = await zagruzitVarianty<PoolVariant>(zadanie, 'bank', indeks.kinds, ssylki);
  return {
    bloki: indeks.bloki,
    kinds: indeks.kinds.map(({ variants, ...kind }): PoolKind => ({
      ...kind,
      variants: variants.flatMap((v) => est.get(klyuch(kind.id, v.n)) ?? []),
    })),
  };
}

/** «Узнай метод» из нужных вариантов. */
export async function uznayIz(
  zadanie: 4 | 5,
  indeks: IndeksUznay,
  ssylki: readonly Ssylka45[],
): Promise<UznayPool> {
  const est = await zagruzitVarianty<UznayVariant>(zadanie, 'uznay', indeks.kinds, ssylki);
  return {
    kinds: indeks.kinds.map(({ variants, ...kind }) => ({
      ...kind,
      variants: variants.flatMap((v) => est.get(klyuch(kind.id, v.n)) ?? []),
    })),
  };
}

/** Пустые наборы: в режиме без «Узнай метод» его файлы не нужны, и наоборот. */
export const PUSTOY_POOL = (indeks: IndeksPool): Pool => ({
  bloki: indeks.bloki,
  kinds: indeks.kinds.map(({ variants: _variants, ...kind }) => ({ ...kind, variants: [] })),
});

export const PUSTOY_UZNAY: UznayPool = { kinds: [] };

/**
 * Вариант листа: загруженный — целиком, остальные — заглушкой с
 * номером и отпечатком условия. Выбор задач листа (sheet4.ts) смотрит
 * только на номер и отпечаток `u`, поэтому на заглушках выбор тот же,
 * что на полном банке; в лист попадают только загруженные варианты.
 */
export type VariantLista = PoolVariant & { u: string };

/** Банк листа: все варианты оглавления, загружены — только нужные. */
export async function poolLista(
  zadanie: 4 | 5,
  indeks: IndeksLista,
  ssylki: readonly Ssylka45[],
): Promise<Pool> {
  const est = await zagruzitVarianty<PoolVariant>(zadanie, 'bank', indeks.kinds, ssylki);
  return {
    bloki: indeks.bloki,
    kinds: indeks.kinds.map(({ variants, ...kind }): PoolKind => ({
      ...kind,
      variants: variants.map((v): VariantLista => {
        const polny = est.get(klyuch(kind.id, v.n));
        return polny === undefined
          ? { n: v.n, u: v.u, uslovie: '', seal: '', steps: '' }
          : { ...polny, u: fingerprint(SOL_USLOVIYA, polny.uslovie) };
      }),
    })),
  };
}
