'use client';

/**
 * Сессия тренажёра: задачи со свежими числами, собранные в браузере.
 *
 * Движок graph/ детерминирован по seed: новый seed — новый набор
 * коэффициентов при тех же правилах composition. Поэтому сессия
 * собирается тут же, в браузере, а не на сборке: ответы считает
 * движок в момент генерации, живут они в памяти вкладки, и в
 * исходник страницы не попадает ни один.
 *
 * Набор собирается целиком (10 или 20 задач), по одной задаче движок
 * не генерирует: чтобы взять N задач нужного уровня, наборы
 * собираются на разных seed, пока задач не наберётся. Задача, для
 * которой движок не смог подобрать вариант, отбрасывается вместе
 * с набором — движок бросает исключение, и берётся следующий seed.
 */

import GraphGenerate from '@/lib/graph/generate.js';
import { parseAnswer } from '@/lib/answer';
import { trainerTaskFrom, type EngineTask, type TrainerTask } from '@/lib/trainer';
import type { TrainerModeId } from '@/content/trainerModes';

export interface SessionRequest {
  /** Наборы движка: один навык или все навыки семейства. */
  skills: string[];
  /** Уровень задач. null — любой. */
  level: string | null;
  count: number;
  mode: TrainerModeId;
  /** История ошибок: идентификаторы задач, например «12.A-03». */
  mistakes: string[];
}

export interface Session {
  tasks: TrainerTask[];
  /** Сколько задач не добрали: наборы на всех seed кончились раньше. */
  shortage: number;
  /** Сколько seed движок отверг: правила набора оказались слишком узкими. */
  rejected: number;
}

/* Сколько seed перебирать на один набор. Задач уровня lucky в 12.C
   всего две на набор: на десять задач нужно пять удачных seed. */
const SEED_TRIES = 24;

/**
 * Откуда берётся seed для очередной попытки собрать набор.
 * Тренажёру нужен случайный — два запуска подряд должны различаться;
 * листу для печати — воспроизводимый, чтобы лист ученика и лист
 * с ответами по одному адресу содержали одни и те же задачи.
 */
export type SeedFor = (setId: string, attempt: number) => string;

/** Случайный seed: время и шум. */
export const randomSeed: SeedFor = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

/** Воспроизводимый seed от одного базового слова. */
export function seedFrom(base: string): SeedFor {
  return (setId, attempt) => `${base}:${setId}:${attempt}`;
}

/** У задачи есть посчитанный числовой ответ — иначе её нельзя проверить. */
function answerable(task: EngineTask & { answerType?: string }): boolean {
  return (task.answerType ?? 'number') === 'number' && parseAnswer(task.answer) !== null;
}

function levelOf(task: EngineTask): string | null {
  return task.meta.level ?? null;
}

interface Picked {
  task: EngineTask;
  seedNo: number;
}

/** Набор на новом seed. null — движок не подобрал вариант. */
function trySet(setId: string, seed: string, tally: { rejected: number }): EngineTask[] | null {
  try {
    return GraphGenerate.generateSet(setId, seed) as EngineTask[];
  } catch {
    tally.rejected += 1;
    return null;
  }
}

/**
 * Задачи одного набора: want штук нужного уровня. Сначала разные
 * задачи набора, потом — те же задачи на других seed: числа у них
 * уже другие.
 */
function fromSet(
  setId: string,
  level: string | null,
  want: number,
  seedFor: SeedFor,
  tally: { rejected: number },
): EngineTask[] {
  const picked: Picked[] = [];
  const seen = new Set<string>();

  for (let seedNo = 0; seedNo < SEED_TRIES && picked.length < want; seedNo += 1) {
    const tasks = trySet(setId, seedFor(setId, seedNo), tally);
    if (tasks === null) {
      continue;
    }
    const fit = tasks.filter((task) => answerable(task) && (level === null || levelOf(task) === level));
    /* Новые задачи — вперёд, повторы — только если новых уже нет. */
    const fresh = fit.filter((task) => !seen.has(task.id));
    const queue = fresh.length > 0 ? fresh : fit;
    queue.forEach((task) => {
      if (picked.length < want) {
        picked.push({ task, seedNo });
        seen.add(task.id);
      }
    });
  }
  return picked.map((item) => item.task);
}

/** Задачи из истории ошибок: те же идентификаторы, новые seed. */
function fromMistakes(
  ids: string[],
  want: number,
  seedFor: SeedFor,
  tally: { rejected: number },
): EngineTask[] {
  const out: EngineTask[] = [];
  const bySet = new Map<string, EngineTask[]>();
  for (let round = 0; round < SEED_TRIES && out.length < want && ids.length > 0; round += 1) {
    bySet.clear();
    for (const id of ids) {
      if (out.length >= want) {
        break;
      }
      const setId = id.split('-')[0] ?? '';
      let tasks = bySet.get(setId);
      if (tasks === undefined) {
        tasks = trySet(setId, seedFor(setId, round), tally) ?? [];
        bySet.set(setId, tasks);
      }
      const found = tasks.find((task) => task.id === id);
      if (found !== undefined && answerable(found)) {
        out.push(found);
      }
    }
  }
  return out;
}

export interface PickedTasks {
  tasks: EngineTask[];
  shortage: number;
  rejected: number;
}

/**
 * Задачи движка по запросу: общий шаг тренажёра и листа для печати.
 * Что с ними делать дальше — экран задания или карточка листа, —
 * решает тот, кто вызвал.
 */
export function pickTasks(request: SessionRequest, seedFor: SeedFor): PickedTasks {
  const tally = { rejected: 0 };
  const want = Math.max(1, Math.floor(request.count));
  let engine: EngineTask[] = [];

  if (request.mode === 'mistakes') {
    const known = request.mistakes.filter((id) =>
      request.skills.some((setId) => id.startsWith(`${setId}-`)),
    );
    engine = fromMistakes(known, want, seedFor, tally);
  } else {
    const sets = request.skills;
    /* Поровну с каждого набора, остаток — первым. Порядок задач
       перемешает подход: одинаковые типы подряд не пойдут. */
    const base = Math.floor(want / Math.max(1, sets.length));
    let rest = want - base * sets.length;
    sets.forEach((setId) => {
      const extra = rest > 0 ? 1 : 0;
      rest -= extra;
      engine = engine.concat(fromSet(setId, request.level, base + extra, seedFor, tally));
    });
  }

  return { tasks: engine, shortage: Math.max(0, want - engine.length), rejected: tally.rejected };
}

/** Собрать сессию тренажёра по запросу конфигуратора. */
export function buildSession(request: SessionRequest): Session {
  const picked = pickTasks(request, randomSeed);
  return {
    tasks: picked.tasks.map((task) => trainerTaskFrom(task)),
    shortage: picked.shortage,
    rejected: picked.rejected,
  };
}
