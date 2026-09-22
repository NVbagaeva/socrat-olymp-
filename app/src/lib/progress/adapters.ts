'use client';

/**
 * Точки записи по движкам.
 *
 * Каждая функция уже знает свою пару (задание, подтема, источник) —
 * экрану не нужно знать устройство журнала, только передать то, что
 * у него и так под рукой. Список навыков и подтем по каждому заданию
 * зафиксирован решениями этапа 1:
 *
 * — №12: подтема пока одна — «linear»; опорные навыки (k, b, b-point,
 *   equation, point) и тренажёрные (12.A…12.D) — разные списки.
 * — №8: подтемы у задания нет, она равна всему заданию (id «8»);
 *   в опорных навык — блок (P8-1…P8-5), в тренажёре — Skill (S1…S11):
 *   то, что ученик выбирает в конфигураторе, а не прототип движка
 *   (прототипы ему не видны и не выбираются).
 * — №3: подтема — раздел (римский номер), навык — прототип: именно
 *   его ученик выбирает фильтром внутри тренажёра раздела.
 * — №4/№5: подтемы у задания нет; в опорных навык — блок конспекта,
 *   в тренажёре — метод, включая режим «Узнай метод»: это тот же
 *   навык-метод, только другая форма вопроса, а не третья таксономия.
 *
 * Это не «выдуманная» разметка: она либо повторяет то, что уже
 * выбирает ученик на экране, либо — там, где выбора нет (№8) —
 * единицу, которую показывает конфигуратор.
 */

import { recordAttempt } from './store';
import type { TaskNo, Verdict } from './types';

export interface AttemptArgs {
  skillId: string;
  /** Экземпляр задачи: для журнала и будущего «повтора ошибок». */
  taskId: string;
  verdict: Verdict;
  /** Была ли на этом экземпляре открыта подсказка, разбор или решение. */
  hintUsed: boolean;
  /** Верно с первой проверки: до этого не было ни ошибки, ни разбора. */
  firstTry: boolean;
  seconds?: number;
  /** null или не передано — семя не нужно/недоступно (см. отчёт). */
  seed?: string | null;
}

function write(taskNo: TaskNo, subtopicId: string, source: 'prep' | 'trainer', args: AttemptArgs): void {
  recordAttempt({
    taskNo,
    subtopicId,
    source,
    skillId: args.skillId,
    taskId: args.taskId,
    seed: args.seed ?? null,
    verdict: args.verdict,
    hintUsed: args.hintUsed,
    firstTry: args.firstTry,
    seconds: args.seconds ?? 0,
  });
}

/** №12, опорные задачи (PrepTaskScreen). */
export function recordPrep12(args: AttemptArgs): void {
  write('12', 'linear', 'prep', args);
}

/** №12, тренажёр (TrainerScreen). */
export function recordTrainer12(args: AttemptArgs): void {
  write('12', 'linear', 'trainer', args);
}

/** №8, опорные задачи (Podgotovka8Screen). */
export function recordPrep8(args: AttemptArgs): void {
  write('8', '8', 'prep', args);
}

/** №8, тренажёр (Trenazher8Screen). skillId — Skill (S1…S11), не прототип. */
export function recordTrainer8(args: AttemptArgs): void {
  write('8', '8', 'trainer', args);
}

/** №4/№5, опорные задачи (PodgotovkaBlok). skillId — блок конспекта. */
export function recordPrepVeroyatnost(zadanie: 4 | 5, args: AttemptArgs): void {
  write(zadanie === 4 ? '4' : '5', String(zadanie), 'prep', args);
}

/** №4/№5, тренажёр и режим «Узнай метод» (Sessiya). skillId — метод. */
export function recordTrainerVeroyatnost(zadanie: 4 | 5, args: AttemptArgs): void {
  write(zadanie === 4 ? '4' : '5', String(zadanie), 'trainer', args);
}

/** №3, тренажёр (Solid3Trainer). razdel — римский номер раздела,
    он же подтема; skillId — прототип, выбираемый фильтром раздела. */
export function recordTrainer3(razdel: string, args: AttemptArgs): void {
  write('3', razdel, 'trainer', args);
}
