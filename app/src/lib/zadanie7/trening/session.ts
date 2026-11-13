/**
 * Тренировка №7 в «Стеклянной сцене»: какие задачи банка в неё идут.
 *
 * Задача — запись банка: «F012» (открытый банк ФИПИ) или «P18-a03»
 * (аналог). Тренировка хранит ключ и прототип; условие и закрытый
 * ответ приезжают файлом прототипа (lib/zadanie7/dannye.ts), разбор
 * строит решатель в браузере. Модуль чистый: банк сюда не
 * импортируется, каталог приходит с сервера пропсом. Проверяется
 * scripts/check-progress-7.mjs.
 */

import type { Mistake } from '@/lib/progressLog';
import { isRecord } from '@/lib/trainerSession/restore';

/** Каталог банка: прототип → задачи открытого банка и аналоги. */
export type Katalog7 = Record<string, { f: string[]; a: string[] }>;

/** Источник задач в выборе тем. */
export type Istochnik7 = 'vse' | 'fipi' | 'new';

export interface Task7 {
  /** Ключ задачи банка: «F012», «P18-a03». */
  id: string;
  /** Прототип: «P18». */
  p: string;
  /** Аналог из «Работы над ошибками»: задача, ошибку в которой он закрывает. */
  fixes?: string;
}

const KLYUCH = /^(F\d{3}|P\d\d-a\d\d)$/;
const PROTOTIP = /^P\d\d$/;

export function etoKlyuch7(id: string): boolean {
  return KLYUCH.test(id);
}

/** Задача → прототип по каталогу. */
export function prototipyZadach(katalog: Katalog7): Map<string, string> {
  const out = new Map<string, string>();
  for (const [p, { f, a }] of Object.entries(katalog)) {
    for (const id of f) out.set(id, p);
    for (const id of a) out.set(id, p);
  }
  return out;
}

/** Прототип задачи: у аналога он в ключе, у задачи ФИПИ — по каталогу. */
export function prototipZadachi7(id: string, poKatalogu: ReadonlyMap<string, string>): string {
  return poKatalogu.get(id) ?? (id.startsWith('P') ? id.slice(0, 3) : id);
}

type Random = () => number;

function shuffled<T>(items: readonly T[], random: Random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}

/**
 * Задачи прототипа под источник. «Из банка ФИПИ» у прототипа без задач
 * открытого банка (П-10, П-30 … П-35) даёт аналоги: иначе тип выпал бы
 * из тренировки молча — так было и в прежнем тренажёре.
 */
function zadachiPrototipa(katalog: Katalog7, p: string, istochnik: Istochnik7): string[] {
  const z = katalog[p];
  if (z === undefined) return [];
  if (istochnik === 'fipi') return z.f.length > 0 ? z.f : z.a;
  if (istochnik === 'new') return z.a;
  return [...z.f, ...z.a];
}

/** Сколько задач в банке у выбранных прототипов под источник. */
export function skolkoZadach7(katalog: Katalog7, tipy: string[], istochnik: Istochnik7): number {
  return tipy.reduce((sum, p) => sum + zadachiPrototipa(katalog, p, istochnik).length, 0);
}

/**
 * Тренировка по прототипам: прототипы по кругу, из каждого — следующая
 * задача, сначала ещё не решённые.
 */
export function buildByTipy7(
  katalog: Katalog7,
  tipy: string[],
  count: number,
  closed: ReadonlySet<string>,
  istochnik: Istochnik7 = 'vse',
  random: Random = Math.random,
): Task7[] {
  const ocheredi = shuffled(tipy, random)
    .map((p) => {
      const vse = shuffled(zadachiPrototipa(katalog, p, istochnik), random);
      return {
        p,
        ids: [...vse.filter((id) => !closed.has(id)), ...vse.filter((id) => closed.has(id))],
      };
    })
    .filter((o) => o.ids.length > 0);
  const out: Task7[] = [];
  let pusto = 0;
  for (let i = 0; out.length < count && pusto < ocheredi.length; i += 1) {
    const ochered = ocheredi[i % ocheredi.length];
    const id = ochered?.ids.shift();
    if (ochered === undefined || id === undefined) {
      pusto += 1;
      continue;
    }
    pusto = 0;
    out.push({ id, p: ochered.p });
  }
  return out;
}

/**
 * Аналог задачи: другая задача того же прототипа, которой ещё нет в
 * тренировке. null — у прототипа не осталось других задач.
 */
export function analogOf7(
  katalog: Katalog7,
  p: string,
  id: string,
  avoid: ReadonlySet<string> = new Set(),
  random: Random = Math.random,
): string | null {
  const drugie = shuffled(
    zadachiPrototipa(katalog, p, 'vse').filter((key) => key !== id && !avoid.has(key)),
    random,
  );
  return drugie[0] ?? null;
}

/** Сколько аналогов одной ошибки в одной тренировке: столько нужно подряд, чтобы она ушла. */
const ANALOGS_PER_MISTAKE = 2;

/**
 * «Работа над ошибками»: по каждой открытой ошибке — новые задачи того
 * же прототипа (до двух), вперемешку с аналогами других ошибок. Сами
 * задачи с ошибкой не выдаются.
 */
export function buildMistakes7(
  katalog: Katalog7,
  mistakes: Mistake[],
  count: number,
  random: Random = Math.random,
): Task7[] {
  const picked = shuffled(mistakes, random).slice(
    0,
    Math.max(1, Math.ceil(count / ANALOGS_PER_MISTAKE)),
  );
  const out: Task7[] = [];
  const seen = new Set<string>(mistakes.map((m) => m.task));
  for (let round = 0; round < ANALOGS_PER_MISTAKE; round += 1) {
    for (const mistake of picked) {
      if (out.length >= count) break;
      if (!PROTOTIP.test(mistake.kind)) continue;
      const id = analogOf7(katalog, mistake.kind, mistake.task, seen, random);
      if (id !== null) {
        seen.add(id);
        out.push({ id, p: mistake.kind, fixes: mistake.task });
      }
    }
  }
  return out;
}

/* ── Запись тренировки в сессии ──────────────────────────────── */

export interface Trenazher7Payload {
  tasks: Task7[];
  /** Без подсказок и решений до итогов. */
  control: boolean;
  /** Часы на панели. */
  timer?: boolean;
}

function isTask(value: unknown): value is Task7 {
  return (
    isRecord(value) &&
    typeof value['id'] === 'string' &&
    KLYUCH.test(value['id']) &&
    typeof value['p'] === 'string' &&
    PROTOTIP.test(value['p']) &&
    (value['fixes'] === undefined || typeof value['fixes'] === 'string')
  );
}

/** Проверка формата при чтении из хранилища: чужое и повреждённое отсекается. */
export function isTrenazher7Payload(value: unknown): value is Trenazher7Payload {
  return (
    isRecord(value) &&
    typeof value['control'] === 'boolean' &&
    (value['timer'] === undefined || typeof value['timer'] === 'boolean') &&
    Array.isArray(value['tasks']) &&
    value['tasks'].length > 0 &&
    value['tasks'].every(isTask)
  );
}

/**
 * Запись тренировки из хранилища. Понимает и прежний формат (до
 * редизайна): { zadachi: [{ id, prototypeId, … }] } — незаконченная
 * тренировка открывается на той же задаче, с подсказками и часами.
 */
export function razobratZapis7(packed: unknown): Trenazher7Payload | null {
  if (isTrenazher7Payload(packed)) {
    return packed;
  }
  if (!isRecord(packed) || !Array.isArray(packed['zadachi'])) {
    return null;
  }
  const tasks: Task7[] = [];
  for (const z of packed['zadachi'] as unknown[]) {
    if (
      !isRecord(z) ||
      typeof z['id'] !== 'string' ||
      !KLYUCH.test(z['id']) ||
      typeof z['prototypeId'] !== 'string' ||
      !PROTOTIP.test(z['prototypeId'])
    ) {
      return null;
    }
    tasks.push({ id: z['id'], p: z['prototypeId'] });
  }
  return tasks.length === 0 ? null : { tasks, control: false, timer: true };
}

/**
 * «Работа над ошибками» на итогах: по задаче с ошибкой — другая задача
 * того же прототипа. Аналог помнит, какую ошибку закрывает (у аналога
 * аналога — ту же исходную).
 */
export function similarTrenazher7(
  katalog: Katalog7,
  payload: Trenazher7Payload,
  indexes: number[],
): Trenazher7Payload | null {
  const seen = new Set<string>(payload.tasks.map((t) => t.id));
  const tasks = indexes.flatMap((at) => {
    const source = taskAt7(payload, at);
    if (source === undefined) return [];
    const id = analogOf7(katalog, source.p, source.id, seen);
    if (id === null) return [];
    seen.add(id);
    return [{ id, p: source.p, fixes: source.fixes ?? source.id }];
  });
  return tasks.length === 0 ? null : { ...payload, tasks };
}

/* ── «Похожая задача»: замены на экране ────────────────────────
   Экран подменяет задачу тренировки другой задачей того же прототипа
   и кладёт её сюда, чтобы итоги описывали ту задачу, которую ученик
   решал. Ключ — задания тренировки (по ссылке). */

export const ZAMENY7 = new WeakMap<Trenazher7Payload, Record<number, Task7>>();

/** Задача тренировки с учётом замены. */
export function taskAt7(payload: Trenazher7Payload, at: number): Task7 | undefined {
  return ZAMENY7.get(payload)?.[at] ?? payload.tasks[at];
}
