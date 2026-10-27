/**
 * Тренажёр задания №1: из чего собирается тренировка.
 *
 * Модуль лёгкий — без движка чертежей и решений: им пользуется экран
 * выбора (счётчики «в банке», предупреждение «в банке только N
 * задач») и сборка плана тренировки. Задача в плане — ссылка: номер
 * задачи банка, номер аналога или прототип и seed новой задачи. Сами
 * задачи собирает trenazher/zadacha.ts уже после «Начать».
 *
 * Устройство — как у тренажёра №11 (lib/zadanie11/trenazher). Тип
 * задачи («подтип» №11) — прототип, раздел — блок I–X. Источник —
 * открытый банк (по умолчанию), банк + новые, только новые. Блок X
 * — темы не из открытого банка: в режиме «только банк» его нет, как
 * разминки у №11.
 */

import type { Blok, Nabor } from '../stseny/dsl';

export type Istochnik = 'bank' | 'mix' | 'new';
export type Level = 1 | 2 | 3;

/** Прототип для экрана выбора: всё, что нужно без движка. */
export interface PodtipInfo {
  /** Ключ: «p05». */
  id: string;
  proto: number;
  /** Код на сайте: «05». */
  kod: string;
  section: Blok;
  /** Название с формулами в $…$. */
  title: string;
  level: Level;
  /** Задач открытого банка. */
  vBanke: number;
}

export interface RazdelInfo {
  id: Blok;
  nazvanie: string;
  podtipy: PodtipInfo[];
}

/** Задача банка или аналог — числа условия, без ответа. */
export interface UslovieBanka {
  /** Номер: задача Блока 1 ФИПИ (1–214) или аналог (1000 + …). */
  no: number;
  id: string;
  params: Nabor;
  /** Аналог из пула: «новая» задача с готовыми числами. */
  analog: boolean;
}

export type ZadachaPlan =
  { vid: 'bank' | 'analog'; no: number; id: string } | { vid: 'new'; id: string; seed: string };

/** Ключ прототипа: 5 → «p05». */
export function klyuchProto(proto: number): string {
  return `p${String(proto).padStart(2, '0')}`;
}

/** Прототип по ключу: «p05» → 5. */
export function protoKlyucha(id: string): number {
  return Number(id.slice(1));
}

/** Номер аналога в списке банка тренажёра: 1000 + прототип·100 + номер (до 99 аналогов). */
export function nomerAnaloga(proto: number, no: number): number {
  return 1000 + proto * 100 + (no - 1);
}

/** Ключ задачи: прототип и откуда она — для списка ошибок и статистики. */
export function klyuchZadachi(plan: ZadachaPlan): string {
  if (plan.vid === 'new') {
    return `${plan.id}|n${plan.seed}`;
  }
  return `${plan.id}|${plan.vid === 'bank' ? 'b' : 'a'}${plan.no}`;
}

/** Прототип по ключу задачи из списка ошибок. */
export function podtipKlyucha(key: string): string {
  return key.split('|')[0] ?? '';
}
