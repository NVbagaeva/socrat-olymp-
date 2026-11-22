/**
 * Тренировка №3 в «Стеклянной сцене»: какие задачи банка в неё идут.
 *
 * Задача — вариант прототипа банка: ключ «P03-01#3». Тренировка хранит
 * только ключи; условие, чертёж и закрытые ответ с решением приезжают
 * отдельно, файлом прототипа (./zagruzka.ts). Модуль чистый: банк сюда
 * не импортируется, список задач (каталог) приходит с сервера пропсом.
 */

import { prototipyTipa, prototipZadachi } from '@/content/zadanie3/gruppy';
import type { Mistake } from '@/lib/progressLog';
import { isRecord } from '@/lib/trainerSession/restore';

/** Каталог банка: прототип → номера вариантов и какие из них из открытого банка ФИПИ. */
export type Katalog3 = Record<string, { n: number[]; fipi: number[] }>;

/** Источник задач в выборе тем. */
export type Istochnik3 = 'vse' | 'fipi' | 'new';

export interface Task3 {
  /** Ключ задачи: «P03-01#3». */
  id: string;
  /** Аналог из «Работы над ошибками»: задача, ошибку в которой он закрывает. */
  fixes?: string;
}

const KLYUCH = /^(P03-\d{2})#(\d{1,2})$/;

export function klyuchZadachi3(prototip: string, n: number): string {
  return `${prototip}#${n}`;
}

export function razobratKlyuch3(id: string): { prototip: string; n: number } | null {
  const m = KLYUCH.exec(id);
  return m === null ? null : { prototip: m[1] as string, n: Number(m[2]) };
}

/** Перемешивание на Math.random: тренировка собирается в браузере. */
function shuffled<T>(items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}

function podhodit(katalog: Katalog3, prototip: string, n: number, istochnik: Istochnik3): boolean {
  if (istochnik === 'vse') return true;
  const fipi = katalog[prototip]?.fipi.includes(n) === true;
  return istochnik === 'fipi' ? fipi : !fipi;
}

/** Задачи типа под источник: нерешённые впереди, внутри — случайно. */
function zadachiTipa(
  katalog: Katalog3,
  tip: string,
  closed: ReadonlySet<string>,
  istochnik: Istochnik3,
): string[] {
  const vse = shuffled(
    prototipyTipa(tip).flatMap((prototip) =>
      (katalog[prototip]?.n ?? [])
        .filter((n) => podhodit(katalog, prototip, n, istochnik))
        .map((n) => klyuchZadachi3(prototip, n)),
    ),
  );
  return [...vse.filter((id) => !closed.has(id)), ...vse.filter((id) => closed.has(id))];
}

/** Сколько задач в банке у выбранных типов под источник. */
export function skolkoZadach(katalog: Katalog3, tipy: string[], istochnik: Istochnik3): number {
  return tipy.reduce((sum, tip) => sum + zadachiTipa(katalog, tip, new Set(), istochnik).length, 0);
}

/**
 * Тренировка по типам: типы по кругу, из каждого — следующая задача,
 * сначала ещё не решённые. Два варианта одного прототипа подряд не
 * идут, пока есть другие.
 */
export function buildByTipy(
  katalog: Katalog3,
  tipy: string[],
  count: number,
  closed: ReadonlySet<string>,
  istochnik: Istochnik3 = 'vse',
): Task3[] {
  const ocheredi = shuffled(tipy)
    .map((tip) => zadachiTipa(katalog, tip, closed, istochnik))
    .filter((list) => list.length > 0);
  const out: Task3[] = [];
  let pusto = 0;
  for (let i = 0; out.length < count && pusto < ocheredi.length; i += 1) {
    const ochered = ocheredi[i % ocheredi.length] as string[];
    const proshlyy = out.at(-1);
    const drugoy = (id: string) =>
      proshlyy === undefined || prototipZadachi(id) !== prototipZadachi(proshlyy.id);
    /* Нерешённые важнее, чем «не подряд из одного прототипа»: сначала
       нерешённая другого прототипа, потом любая нерешённая, и только
       потом решённая. */
    let at = ochered.findIndex((id) => !closed.has(id) && drugoy(id));
    if (at === -1) at = ochered.findIndex((id) => !closed.has(id));
    if (at === -1) at = ochered.findIndex(drugoy);
    const id = ochered.splice(at === -1 ? 0 : at, 1)[0];
    if (id === undefined) {
      pusto += 1;
      continue;
    }
    pusto = 0;
    out.push({ id });
  }
  return out;
}

/**
 * Аналог задачи: другой вариант того же прототипа, которого ещё нет в
 * тренировке. null — у прототипа не осталось других вариантов.
 */
export function analogOf3(
  katalog: Katalog3,
  id: string,
  avoid: ReadonlySet<string> = new Set(),
): string | null {
  /* Ошибки прежнего формата записаны как «P03-01:3». */
  const k = razobratKlyuch3(id.replace(':', '#'));
  if (k === null) return null;
  const drugie = shuffled(
    (katalog[k.prototip]?.n ?? [])
      .filter((n) => n !== k.n)
      .map((n) => klyuchZadachi3(k.prototip, n))
      .filter((key) => !avoid.has(key)),
  );
  return drugie[0] ?? null;
}

/** Сколько аналогов одной ошибки в одной тренировке: столько нужно подряд, чтобы она ушла. */
const ANALOGS_PER_MISTAKE = 2;

/**
 * «Работа над ошибками»: по каждой открытой ошибке — новые аналоги (до
 * двух), вперемешку с аналогами других ошибок. Те же задачи, в которых
 * была ошибка, не выдаются.
 */
export function buildMistakes3(katalog: Katalog3, mistakes: Mistake[], count: number): Task3[] {
  const picked = shuffled(mistakes).slice(0, Math.max(1, Math.ceil(count / ANALOGS_PER_MISTAKE)));
  const out: Task3[] = [];
  /* Сами задачи с ошибкой в тренировку не идут. */
  const seen = new Set<string>(mistakes.map((m) => m.task.replace(':', '#')));
  for (let round = 0; round < ANALOGS_PER_MISTAKE; round += 1) {
    for (const mistake of picked) {
      if (out.length >= count) break;
      const id = analogOf3(katalog, mistake.task, seen);
      if (id !== null) {
        seen.add(id);
        out.push({ id, fixes: mistake.task });
      }
    }
  }
  return out;
}

/* ── Запись тренировки в сессии ──────────────────────────────── */

export interface Trenazher3Payload {
  tasks: Task3[];
  /** Без подсказок и решений до итогов. */
  control: boolean;
  /** Часы на панели. */
  timer?: boolean;
}

function isTask(value: unknown): value is Task3 {
  return (
    isRecord(value) &&
    typeof value['id'] === 'string' &&
    KLYUCH.test(value['id']) &&
    (value['fixes'] === undefined || typeof value['fixes'] === 'string')
  );
}

/** Проверка формата при чтении из хранилища: чужое и повреждённое отсекается. */
export function isTrenazher3Payload(value: unknown): value is Trenazher3Payload {
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
 * «Работа над ошибками» на итогах: по задаче с ошибкой — другой вариант
 * того же прототипа. Аналог помнит, какую ошибку закрывает (у аналога
 * аналога — ту же исходную).
 */
export function similarTrenazher3(
  katalog: Katalog3,
  payload: Trenazher3Payload,
  indexes: number[],
): Trenazher3Payload | null {
  const seen = new Set<string>(payload.tasks.map((t) => t.id));
  const tasks = indexes.flatMap((at) => {
    const source = taskAt3(payload, at);
    if (source === undefined) return [];
    const id = analogOf3(katalog, source.id, seen);
    if (id === null) return [];
    seen.add(id);
    return [{ id, fixes: source.fixes ?? source.id }];
  });
  return tasks.length === 0 ? null : { ...payload, tasks };
}

/* ── «Похожая задача»: замены на экране ────────────────────────
   Экран подменяет задачу тренировки другим вариантом того же прототипа
   и кладёт его сюда, чтобы итоги описывали ту задачу, которую ученик
   решал. Ключ — задания тренировки (по ссылке). */

export const ZAMENY3 = new WeakMap<Trenazher3Payload, Record<number, Task3>>();

/** Задача тренировки с учётом замены. */
export function taskAt3(payload: Trenazher3Payload, at: number): Task3 | undefined {
  return ZAMENY3.get(payload)?.[at] ?? payload.tasks[at];
}
