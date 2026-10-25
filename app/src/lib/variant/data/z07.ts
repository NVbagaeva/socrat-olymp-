/**
 * Данные задания №7 для генератора вариантов (маршрут
 * /variant/dannye/z07.json и автотест). Модуль серверный: банк с
 * ответами читается здесь, в браузер уходят только условия задач ФИПИ
 * и параметры уравнений — **без ответов и без отпечатков**, как в
 * public/data/zadanie7 (lib/zadanie7/dannye-server.ts). Ответ и разбор
 * считает решатель прототипа в браузере, как лист №7 (List7).
 *
 * Условие аналога не передаётся: прототип собирает его по параметрам
 * (`uslovie`) — самотест раздела сверяет, что текст банка тот же.
 */

import { ANALOGI, FIPI } from '@/lib/zadanie7/bank';
import type { BankItem } from '@/lib/zadanie7/types';
import type { Dannye7, Zadacha7 } from '../adapters/z07/dannye';

function zadacha(b: BankItem): Zadacha7 {
  const z: Zadacha7 = { id: b.id, p: b.prototypeId, params: b.params };
  if (b.source === 'fipi') {
    z.t = b.text;
    if (b.no !== undefined) z.no = b.no;
  }
  return z;
}

export function dannye(): Dannye7 {
  return { z: [...FIPI, ...ANALOGI].map(zadacha) };
}
