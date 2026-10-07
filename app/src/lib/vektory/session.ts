'use client';

/**
 * Сессия тренажёра №2: задачи со свежими числами, собранные в браузере.
 *
 * Генератор детерминирован по seed, новый seed — новые числа. Ответ
 * считается здесь же и тут же закрывается: в состояние экрана уходят
 * отпечаток и зашифрованный разбор (шаги с заголовками и рисунок с
 * катетами), число ответа нигде не хранится. Рисунок условия — без
 * катетов: они появляются только вместе с первой подсказкой.
 */

import type { TrainerModeId } from '@/content/trainerModes';
import { typeset } from '../tex';
import { generate } from './generate';
import { sluchaynyySeed } from './prep/generate';
import { PROTOTYPES, prototypeById } from './prototypes';
import { renderVectorPlane } from './render';
import { sealAnswer, sealText } from './secret';
import type { Gruppa } from './types';

export interface ShagHtml {
  zagolovokHtml: string;
  strokiHtml: string[];
}

/** Разбор задачи: закрыт отпечатком вместе с рисунком с катетами. */
export interface RazborTrenazhera {
  shagi: ShagHtml[];
  risunokSvg: string | null;
}

export interface Task2 {
  /** Идентификатор задачи: прототип и seed — по нему задача воспроизводится. */
  id: string;
  prototype: string;
  gruppa: Gruppa;
  questionHtml: string;
  /** Рисунок условия без катетов; null — задача по координатам. */
  risunokSvg: string | null;
  /** Отпечаток ответа. */
  seal: string;
  /** Разбор (JSON RazborTrenazhera), закрытый отпечатком. */
  razbor: string;
}

export interface Session2Request {
  /** Прототипы: один или все. */
  prototypes: string[];
  count: number;
  mode: TrainerModeId;
  /** История ошибок: идентификаторы задач. */
  mistakes: string[];
}

export { sluchaynyySeed as randomSeed };

export function taskId(prototype: string, seed: string): string {
  return `${prototype}|${seed}`;
}

/** Задача по прототипу и seed, сразу в закрытом виде. */
export function makeTask(prototype: string, seed: string): Task2 {
  const task = generate(prototype, seed);
  const seal = sealAnswer(task.otvet);
  const razbor: RazborTrenazhera = {
    shagi: task.shagi.map((s) => ({
      zagolovokHtml: typeset(s.zagolovok),
      strokiHtml: s.stroki.map((line) => typeset(line)),
    })),
    risunokSvg: task.risunok === null ? null : renderVectorPlane({ ...task.risunok, hints: true }),
  };
  return {
    id: taskId(prototype, seed),
    prototype,
    gruppa: prototypeById(prototype)?.gruppa ?? 'A',
    questionHtml: typeset(task.uslovie),
    risunokSvg: task.risunok === null ? null : renderVectorPlane(task.risunok),
    seal,
    razbor: sealText(JSON.stringify(razbor), seal),
  };
}

/** Перемешивание на Math.random: сессия и так собирается в браузере. */
function shuffled<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}

export function buildSession2(request: Session2Request): Task2[] {
  if (request.mode === 'mistakes') {
    const allowed = new Set(request.prototypes);
    const own = request.mistakes.filter((id) => allowed.has(id.split('|')[0] ?? ''));
    return shuffled(own)
      .slice(0, request.count)
      .flatMap((id) => {
        const [prototype, seed] = id.split('|');
        if (prototype === undefined || seed === undefined) {
          return [];
        }
        try {
          return [makeTask(prototype, seed)];
        } catch {
          return [];
        }
      });
  }
  const prototypes = shuffled(request.prototypes.filter((id) => prototypeById(id) !== undefined));
  if (prototypes.length === 0) {
    return [];
  }
  const tasks: Task2[] = [];
  let guard = 0;
  while (tasks.length < request.count && guard < request.count * 20) {
    guard += 1;
    const prototype = prototypes[tasks.length % prototypes.length] as string;
    try {
      tasks.push(makeTask(prototype, sluchaynyySeed()));
    } catch {
      /* Генератор не подобрал параметры на этом seed — берём следующий. */
    }
  }
  return tasks;
}

/** Название прототипа словами, без TeX: для статистики и сводок. */
export function nazvanieTekstom(prototype: string): string {
  const p = prototypeById(prototype);
  if (p === undefined) {
    return prototype;
  }
  return p.nazvanie
    .replace(/\\vec\{([a-z])\}/g, '$1')
    .replace(/\\,/g, ' ')
    .replace(/\$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Название типа задания для статистики: код и название прототипа. */
export function kindTitle(prototype: string): string {
  return `${prototype} · ${nazvanieTekstom(prototype)}`;
}

export { PROTOTYPES };
