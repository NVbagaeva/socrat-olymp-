/**
 * Тренажёр задания №11: из чего собирается тренировка.
 *
 * Модуль лёгкий — без движка решений: им пользуется экран выбора
 * (счётчики «в банке», предупреждение «в банке только N задач») и
 * сборка плана тренировки. Задача в плане — ссылка: номер задачи
 * банка или подтип и seed новой задачи. Сами задачи собирает
 * trenazher/zadacha.ts уже после нажатия «Начать».
 *
 * Источник — переключатель из трёх положений: только открытый банк
 * (по умолчанию), банк + новые, только новые. Разминка (РЗ) — не
 * открытый банк: в режиме «только банк» её нет, в смешанном её
 * задачи идут с пометкой «разминка».
 */

import type { Level, Params, SectionId } from '../types';

export type Istochnik = 'bank' | 'mix' | 'new';

/** Подтип для экрана выбора: всё, что нужно без движка. */
export interface PodtipInfo {
  id: string;
  /** Код на сайте: «ДП-07». */
  kod: string;
  section: SectionId;
  title: string;
  level: Level;
  keywords: string[];
  /** Задач открытого банка (у РЗ — задач разминки). */
  vBanke: number;
}

export interface RazdelInfo {
  id: SectionId;
  kod: string;
  nazvanie: string;
  podtipy: PodtipInfo[];
}

/** Условие задачи банка или разминки — без ответа. */
export interface UslovieBanka {
  /** Номер в списке: по нему задача воспроизводится. */
  no: number;
  id: string;
  params: Params;
  razminka: boolean;
  /**
   * Аналог из пула: «новая» задача с готовым условием. Номер аналога
   * («ДП-07-a01»), его текст и метка сюжета; ответа нет и здесь.
   */
  analog?: { kod: string; tekst: string; plotTag: string };
}

export type ZadachaPlan =
  | { vid: 'bank' | 'razminka' | 'analog'; no: number; id: string }
  | { vid: 'new'; id: string; seed: string };

/** Ключ задачи: подтип и откуда она — для списка ошибок и статистики. */
export function klyuchZadachi(plan: ZadachaPlan): string {
  if (plan.vid === 'new') {
    return `${plan.id}|n${plan.seed}`;
  }
  return `${plan.id}|${plan.vid === 'bank' ? 'b' : plan.vid === 'analog' ? 'a' : 'r'}${plan.no}`;
}

/** Подтип по ключу задачи из списка ошибок. */
export function podtipKlyucha(key: string): string {
  return key.split('|')[0] ?? '';
}
