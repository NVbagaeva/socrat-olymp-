/**
 * Сессия тренажёра №9: задачи со свежими числами и графиками либо из
 * открытого банка, собранные в браузере.
 *
 * Генератор детерминирован по seed, поэтому задачу можно собрать
 * заново по её идентификатору «прототип|seed» (так сессия
 * восстанавливается после перезагрузки). Ответ считается здесь же и
 * тут же закрывается: в состояние уходит отпечаток и закрытый разбор,
 * число ответа нигде не хранится.
 */

import type { TrainerModeId } from '@/content/trainerModes';
import { typeset } from '../tex';
import { generate } from './generate';
import { OPEN_BANK, type OpenBankTask } from './otkrytyj-bank';
import { prototypeById } from './prototypes';
import { openText, sealAnswer, sealText } from './secret';
import { GRUPPY, gruppaById, gruppaOfPrototype, prototypesOfGroup } from './skills';
import type { Figura, Gruppa, Istochnik, Vopros } from './types';

/** Вариант кнопки в вопросе подсказки: текст и пояснение уже набраны KaTeX. */
export interface Variant9 {
  tekstHtml: string;
  verno: boolean;
  /** Почему вариант неверен; у верного пусто. */
  pochemuHtml: string;
}

export interface Vopros9 {
  voprosHtml: string;
  knopki: Variant9[];
  /** Что узнаёт ученик, ответив верно. */
  itogHtml: string | null;
  /** Какие построения показывает рисунок на этом вопросе. */
  shag: number;
}

/** Шаг разбора: заголовок и строки уже набраны KaTeX. */
export interface ShagHtml9 {
  zagolovokHtml: string;
  strokiHtml: string[];
}

export interface Task9 {
  /** «прототип|seed» (сгенерированная) или «прототип|ob:id» (открытый банк). */
  id: string;
  prototype: string;
  group: Gruppa;
  questionHtml: string;
  /** Рисунок для движка; у задач без рисунка и у открытого банка — null. */
  risunok: Figura | null;
  /** Картинка открытого банка: адрес в public. */
  kartinka: string | null;
  /** Отпечаток ответа. */
  seal: string;
  /** Разбор: JSON ShagHtml9[], закрытый отпечатком. Нет разбора — пусто. */
  razborHtml: string;
  /** Лесенка вопросов подсказки; у открытого банка пустая. */
  podskazka: Vopros9[];
  istochnik: Istochnik;
}

export interface Session9Request {
  /** Группы I–V. */
  groups: string[];
  /** Если задано — только эти прототипы (внутри выбранных групп). */
  prototypes?: string[];
  count: number;
  mode: TrainerModeId;
  istochnik: Istochnik;
  /** История ошибок: идентификаторы задач. */
  mistakes: string[];
}

const OPEN_PREFIX = 'ob:';

/** Свежий seed: время и случайное число. */
export function randomSeed(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function taskId(prototype: string, seed: string): string {
  return `${prototype}|${seed}`;
}

function voprosHtml(v: Vopros, index: number): Vopros9 {
  return {
    voprosHtml: typeset(v.vopros),
    knopki: v.knopki.map((item) => ({
      tekstHtml: typeset(item.tekst),
      verno: item.verno,
      pochemuHtml: item.pochemu === undefined || item.pochemu === '' ? '' : typeset(item.pochemu),
    })),
    itogHtml: v.itog === undefined || v.itog === '' ? null : typeset(v.itog),
    shag: v.shag ?? index + 1,
  };
}

/** Сгенерированная задача по прототипу и seed, сразу в закрытом виде. */
export function makeTask(prototype: string, seed: string): Task9 {
  const task = generate(prototype, seed);
  const seal = sealAnswer(task.otvet);
  const shagi: ShagHtml9[] = task.shagi.map((shag) => ({
    zagolovokHtml: typeset(shag.zagolovok),
    strokiHtml: shag.stroki.map((line) => typeset(line)),
  }));
  return {
    id: taskId(prototype, seed),
    prototype,
    group: prototypeById(prototype)?.gruppa ?? 'I',
    questionHtml: typeset(task.uslovie),
    risunok: task.risunok,
    kartinka: null,
    seal,
    razborHtml: sealText(JSON.stringify(shagi), seal),
    podskazka: task.podskazka.map(voprosHtml),
    istochnik: task.istochnik,
  };
}

/** Разбор открытого банка: раскрывается, набирается KaTeX и снова закрывается. */
function openRazbor(item: OpenBankTask): string {
  if (item.razbor === null) {
    return '';
  }
  try {
    const value: unknown = JSON.parse(openText(item.razbor, item.seal));
    const lines = Array.isArray(value)
      ? value.filter((l): l is string => typeof l === 'string')
      : [];
    if (lines.length === 0) {
      return '';
    }
    const shagi: ShagHtml9[] = [
      { zagolovokHtml: '', strokiHtml: lines.map((line) => typeset(line)) },
    ];
    return sealText(JSON.stringify(shagi), item.seal);
  } catch {
    return '';
  }
}

/** Задача открытого банка: условие набрано, разбор закрыт тем же отпечатком. */
export function makeOpenTask(item: OpenBankTask): Task9 {
  return {
    id: taskId(item.prototype, OPEN_PREFIX + item.id),
    prototype: item.prototype,
    group: prototypeById(item.prototype)?.gruppa ?? 'I',
    questionHtml: typeset(item.uslovie),
    risunok: null,
    kartinka: item.kartinka,
    seal: item.seal,
    razborHtml: openRazbor(item),
    podskazka: [],
    istochnik: 'otkrytyj-bank',
  };
}

/** Восстановить задачу по идентификатору. Не собралась — null. */
export function taskFromId(id: string): Task9 | null {
  const at = id.indexOf('|');
  if (at <= 0) {
    return null;
  }
  const prototype = id.slice(0, at);
  const seed = id.slice(at + 1);
  try {
    if (seed.startsWith(OPEN_PREFIX)) {
      const found = OPEN_BANK.find((item) => item.id === seed.slice(OPEN_PREFIX.length));
      return found === undefined ? null : makeOpenTask(found);
    }
    return makeTask(prototype, seed);
  } catch {
    return null;
  }
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

/** Прототипы выбранных групп (и, если заданы, выбранные прототипы). */
function prototypesFor(groups: string[], only: string[] | undefined): string[] {
  const ids = groups.flatMap((id) => {
    const info = gruppaById(id);
    return info === undefined ? [] : prototypesOfGroup(info.id).map((p) => p.id);
  });
  if (only === undefined || only.length === 0) {
    return ids;
  }
  const fit = ids.filter((id) => only.includes(id));
  return fit.length > 0 ? fit : ids;
}

/** Все группы сайта: «Смешанная» и «Повтор ошибок» идут по всему разделу. */
export function allGroupIds(): string[] {
  return GRUPPY.map((g) => g.id);
}

/** Сколько задач открытого банка в группах. */
export function openCount(groups: string[]): number {
  const allowed = new Set(groups);
  return OPEN_BANK.filter((item) => allowed.has(gruppaOfPrototype(item.prototype)?.id ?? ''))
    .length;
}

export function buildSession9(request: Session9Request): Task9[] {
  const groups = request.mode === 'mixed' ? allGroupIds() : request.groups;
  const wantOpen = request.istochnik === 'otkrytyj-bank';

  if (request.mode === 'mistakes') {
    const allowed = new Set(request.groups.length === 0 ? allGroupIds() : request.groups);
    const own = request.mistakes.filter((id) => {
      const prototype = id.split('|')[0] ?? '';
      const group = gruppaOfPrototype(prototype)?.id ?? '';
      const open = id.includes(`|${OPEN_PREFIX}`);
      return allowed.has(group) && open === wantOpen;
    });
    const tasks: Task9[] = [];
    for (const id of shuffled(own)) {
      if (tasks.length >= request.count) {
        break;
      }
      const task = taskFromId(id);
      if (task !== null) {
        tasks.push(task);
      }
    }
    return tasks;
  }

  if (wantOpen) {
    const allowed = new Set(groups);
    const pool = OPEN_BANK.filter((item) => {
      if (!allowed.has(gruppaOfPrototype(item.prototype)?.id ?? '')) {
        return false;
      }
      return request.prototypes === undefined || request.prototypes.length === 0
        ? true
        : request.prototypes.includes(item.prototype);
    });
    return shuffled(pool)
      .slice(0, request.count)
      .map((item) => makeOpenTask(item));
  }

  const prototypes = shuffled(prototypesFor(groups, request.prototypes));
  if (prototypes.length === 0) {
    return [];
  }
  const tasks: Task9[] = [];
  const seen = new Set<string>();
  let failures = 0;
  for (let i = 0; tasks.length < request.count && failures < request.count * 3 + 6; i += 1) {
    const prototype = prototypes[i % prototypes.length] as string;
    const seed = randomSeed();
    try {
      const task = makeTask(prototype, seed);
      if (!seen.has(task.questionHtml)) {
        seen.add(task.questionHtml);
        tasks.push(task);
      }
    } catch {
      /* Генератор не подобрал параметры на этом seed — берём следующий. */
      failures += 1;
    }
  }
  return tasks;
}

/** Название типа задания для статистики: название группы. */
export function kindTitle(prototype: string): string {
  return gruppaOfPrototype(prototype)?.nazvanie ?? prototype;
}

/** Задача из открытого банка по идентификатору. */
export function isOpenId(id: string): boolean {
  return id.includes(`|${OPEN_PREFIX}`);
}
