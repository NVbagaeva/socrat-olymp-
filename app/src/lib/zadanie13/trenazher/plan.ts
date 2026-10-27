/**
 * Задача тренировки №13: прототип, seed и откуда она. Какие задачи
 * идут в тренировку, решает общий тренажёр с фильтрами (filtry13.ts),
 * собирает задачу trenazher/zadacha.ts.
 */

export interface ZadachaPlan13 {
  prototypeId: string;
  seed: string;
  istochnik: 'bank' | 'new';
  vid: 'zadachi' | 'tip';
}
