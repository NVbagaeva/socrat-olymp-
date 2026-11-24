/**
 * Живая сцена параметра (теория №18): параметр сам проходит от min до
 * max с паузами на особых значениях, рисунок строит прежний движок №19
 * (lib/zadanie19/risunok.ts) по описанию из lib/zadanie19/zhivye.ts —
 * оба не тронуты. Здесь — ход и «лента числа решений». Проверка —
 * scripts/check-zhivye.mjs.
 *
 * Модельное время u ∈ [0; 1]: a = min + u · (max − min).
 */

import type { Zhivoy19 } from '@/lib/zadanie19/zhivye';
import type { HodOpcii } from './hod';

export function aIzU(z: Zhivoy19, u: number): number {
  return z.min + (z.max - z.min) * Math.min(Math.max(u, 0), 1);
}

export function uIzA(z: Zhivoy19, a: number): number {
  return (a - z.min) / (z.max - z.min);
}

/** Значение для рисунка и подписей: на сетке шага ползунка (как раньше). */
export function naSetke(z: Zhivoy19, a: number): number {
  const osoboe = z.osobye.find((o) => Math.abs(o.a - a) < z.shag / 2);
  if (osoboe !== undefined && Math.abs(osoboe.a - a) < 1e-9) return osoboe.a;
  const k = Math.round((a - z.min) / z.shag);
  return Math.round((z.min + k * z.shag) * 1e9) / 1e9;
}

/** Ход: весь путь — за 8 с при ×1, пауза на каждом особом значении внутри. */
export function hodParametra(z: Zhivoy19): HodOpcii {
  const ost = [...new Set(z.osobye.map((o) => uIzA(z, o.a)))]
    .filter((u) => u > 1e-9 && u < 1 - 1e-9)
    .sort((p, q) => p - q);
  return { tMax: 1, ostanovki: ost, sekNaEd: 8, sekSnimok: 1.4, razgon: 0.03 };
}

export interface KusokLenty {
  /** Доли шкалы u. */
  ot: number;
  do: number;
  n: number;
}

export interface TochkaLenty {
  u: number;
  n: number;
}

/**
 * Лента числа решений: куски, где число решений постоянно (по частой
 * сетке), и отдельные точки — особые значения, где число решений не
 * такое, как по обе стороны. Только если описание считает решения.
 */
export function lenta(z: Zhivoy19): { kuski: KusokLenty[]; tochki: TochkaLenty[] } | null {
  const res = z.resheniy;
  if (res === undefined) return null;
  const N = 600;
  const kuski: KusokLenty[] = [];
  for (let i = 0; i < N; i += 1) {
    const u0 = i / N;
    const u1 = (i + 1) / N;
    /* Середина ячейки, чтобы не попадать в особые точки. */
    const n = res(aIzU(z, (u0 + u1) / 2));
    const pr = kuski[kuski.length - 1];
    if (pr !== undefined && pr.n === n) pr.do = u1;
    else kuski.push({ ot: u0, do: u1, n });
  }
  const tochki: TochkaLenty[] = [];
  for (const o of z.osobye) {
    const u = uIzA(z, o.a);
    if (u < -1e-9 || u > 1 + 1e-9) continue;
    const n = res(o.a);
    const sleva = kuski.find((k) => k.ot <= u - 1e-6 && k.do >= u - 1e-6);
    const sprava = kuski.find((k) => k.ot <= u + 1e-6 && k.do >= u + 1e-6);
    if (sleva === undefined || sleva.n !== n || sprava === undefined || sprava.n !== n) {
      tochki.push({ u, n });
    }
  }
  return { kuski, tochki };
}
