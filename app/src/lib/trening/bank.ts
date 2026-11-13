/**
 * Тренировка по банку задач раздела — общая часть «Стеклянной сцены»
 * для разделов, где задачи лежат файлами прототипов (public/data/…):
 * №7, №6, дальше №10 и №11. Модуль чистый: банк сюда не импортируется,
 * каталог приходит с сервера пропсом.
 *
 * Задача — запись банка с ключом («F012», «S03», «P18-a03») и
 * прототипом («P18»). Тренировка хранит только ключи; условие и закрытый
 * ответ приезжают файлом прототипа, разбор строит решатель в браузере.
 *
 * Раздел задаёт одно — какие ключи у его задач (`klyuch`). Всё остальное
 * — сборка тренировок, «Работа над ошибками», «Похожая задача», запись в
 * сессии и чтение записи прежнего тренажёра — общее. Проверяется
 * scripts/check-progress-7.mjs и check-progress-6.mjs.
 */

import type { Mistake } from '@/lib/progressLog';
import { isRecord } from '@/lib/trainerSession/restore';

/**
 * Каталог банка: прототип → задачи открытого банка или исходные (`f`),
 * аналоги (`a`) и, у разделов с сюжетами, какие из них сюжетные (`s`).
 */
export type KatalogBanka = Record<string, { f: string[]; a: string[]; s?: string[] }>;

/** Источник задач в выборе тем. */
export type IstochnikBanka = 'vse' | 'fipi' | 'new';

/** Формулировка: все, только сюжетные, только стандартные (№6). */
export type StilBanka = 'vse' | 'syuzhet' | 'standart';

export interface TaskBanka {
  /** Ключ задачи банка. */
  id: string;
  /** Прототип: «P18». */
  p: string;
  /** Аналог из «Работы над ошибками»: задача, ошибку в которой он закрывает. */
  fixes?: string;
}

export interface PayloadBanka {
  tasks: TaskBanka[];
  /** Без подсказок и решений до итогов. */
  control: boolean;
  /** Часы на панели. */
  timer?: boolean;
}

/** Прототип: «P04» (№7, №6), «A6» (№2) или набор №12 («12.A», «12Q.B»). */
const PROTOTIP = /^(P\d\d|[ABC]\d|12[A-Z]?\.[A-Z])$/;

type Random = () => number;

function shuffled<T>(items: readonly T[], random: Random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}

/** Задача → прототип по каталогу. */
export function prototipyZadach(katalog: KatalogBanka): Map<string, string> {
  const out = new Map<string, string>();
  for (const [p, { f, a }] of Object.entries(katalog)) {
    for (const id of f) out.set(id, p);
    for (const id of a) out.set(id, p);
  }
  return out;
}

/**
 * Прототип задачи: по каталогу, иначе из ключа — «P18-a03» (аналог),
 * «A6|k07» (№2), «12Q.B-07» (№12: шаблон набора).
 */
export function prototipZadachi(id: string, poKatalogu: ReadonlyMap<string, string>): string {
  const poKlyuchu = /^P\d\d-/.test(id)
    ? id.slice(0, 3)
    : id.includes('|')
      ? id.split('|')[0]
      : /^12[A-Z]?\.[A-Z]-/.test(id)
        ? id.split('-')[0]
        : id;
  return poKatalogu.get(id) ?? poKlyuchu ?? id;
}

function podStil(katalog: KatalogBanka, p: string, ids: string[], stil: StilBanka): string[] {
  if (stil === 'vse') return ids;
  const s = new Set(katalog[p]?.s ?? []);
  return ids.filter((id) => (stil === 'syuzhet' ? s.has(id) : !s.has(id)));
}

/**
 * Задачи прототипа под источник и формулировку. «Из банка» у прототипа
 * без задач банка (в №7 — П-10, П-30 … П-35) даёт аналоги: иначе тип
 * выпал бы из тренировки молча — так вели себя и прежние тренажёры.
 */
function zadachiPrototipa(
  katalog: KatalogBanka,
  p: string,
  istochnik: IstochnikBanka,
  stil: StilBanka,
): string[] {
  const z = katalog[p];
  if (z === undefined) return [];
  const f = podStil(katalog, p, z.f, stil);
  const a = podStil(katalog, p, z.a, stil);
  if (istochnik === 'fipi') return f.length > 0 ? f : a;
  if (istochnik === 'new') return a;
  return [...f, ...a];
}

/** Сколько задач в банке у выбранных прототипов под источник и формулировку. */
export function skolkoZadach(
  katalog: KatalogBanka,
  tipy: string[],
  istochnik: IstochnikBanka,
  stil: StilBanka = 'vse',
): number {
  return tipy.reduce((sum, p) => sum + zadachiPrototipa(katalog, p, istochnik, stil).length, 0);
}

/**
 * Тренировка по прототипам: прототипы по кругу, из каждого — следующая
 * задача, сначала ещё не решённые.
 */
export function buildByTipy(
  katalog: KatalogBanka,
  tipy: string[],
  count: number,
  closed: ReadonlySet<string>,
  istochnik: IstochnikBanka = 'vse',
  random: Random = Math.random,
  stil: StilBanka = 'vse',
): TaskBanka[] {
  const ocheredi = shuffled(tipy, random)
    .map((p) => {
      const vse = shuffled(zadachiPrototipa(katalog, p, istochnik, stil), random);
      return {
        p,
        ids: [...vse.filter((id) => !closed.has(id)), ...vse.filter((id) => closed.has(id))],
      };
    })
    .filter((o) => o.ids.length > 0);
  const out: TaskBanka[] = [];
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
export function analogOf(
  katalog: KatalogBanka,
  p: string,
  id: string,
  avoid: ReadonlySet<string> = new Set(),
  random: Random = Math.random,
): string | null {
  const drugie = shuffled(
    zadachiPrototipa(katalog, p, 'vse', 'vse').filter((key) => key !== id && !avoid.has(key)),
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
export function buildMistakes(
  katalog: KatalogBanka,
  mistakes: Mistake[],
  count: number,
  random: Random = Math.random,
): TaskBanka[] {
  const picked = shuffled(mistakes, random).slice(
    0,
    Math.max(1, Math.ceil(count / ANALOGS_PER_MISTAKE)),
  );
  const out: TaskBanka[] = [];
  const seen = new Set<string>(mistakes.map((m) => m.task));
  for (let round = 0; round < ANALOGS_PER_MISTAKE; round += 1) {
    for (const mistake of picked) {
      if (out.length >= count) break;
      if (!PROTOTIP.test(mistake.kind)) continue;
      const id = analogOf(katalog, mistake.kind, mistake.task, seen, random);
      if (id !== null) {
        seen.add(id);
        out.push({ id, p: mistake.kind, fixes: mistake.task });
      }
    }
  }
  return out;
}

/* ── Запись тренировки в сессии ──────────────────────────────── */

/** Проверка формата записи под ключи раздела: чужое и повреждённое отсекается. */
export function isPayloadBanka(value: unknown, klyuch: RegExp): value is PayloadBanka {
  return (
    isRecord(value) &&
    typeof value['control'] === 'boolean' &&
    (value['timer'] === undefined || typeof value['timer'] === 'boolean') &&
    Array.isArray(value['tasks']) &&
    value['tasks'].length > 0 &&
    value['tasks'].every(
      (task: unknown) =>
        isRecord(task) &&
        typeof task['id'] === 'string' &&
        klyuch.test(task['id']) &&
        typeof task['p'] === 'string' &&
        PROTOTIP.test(task['p']) &&
        (task['fixes'] === undefined || typeof task['fixes'] === 'string'),
    )
  );
}

/**
 * Запись тренировки из хранилища. Понимает и прежний формат тренажёров
 * №7 и №6 (до редизайна): { zadachi: [{ id, prototypeId, … }], rezhim? }
 * — незаконченная тренировка открывается на той же задаче. Режим
 * «Проверка» №6 становится «Без подсказок и решений».
 */
export function razobratZapis(packed: unknown, klyuch: RegExp): PayloadBanka | null {
  if (isPayloadBanka(packed, klyuch)) {
    return packed;
  }
  if (!isRecord(packed) || !Array.isArray(packed['zadachi'])) {
    return null;
  }
  const tasks: TaskBanka[] = [];
  for (const z of packed['zadachi'] as unknown[]) {
    if (
      !isRecord(z) ||
      typeof z['id'] !== 'string' ||
      !klyuch.test(z['id']) ||
      typeof z['prototypeId'] !== 'string' ||
      !PROTOTIP.test(z['prototypeId'])
    ) {
      return null;
    }
    tasks.push({ id: z['id'], p: z['prototypeId'] });
  }
  return tasks.length === 0
    ? null
    : { tasks, control: packed['rezhim'] === 'proverka', timer: true };
}

/**
 * «Работа над ошибками» на итогах: по задаче с ошибкой — другая задача
 * того же прототипа. Аналог помнит, какую ошибку закрывает (у аналога
 * аналога — ту же исходную).
 */
export function similarBanka(
  katalog: KatalogBanka,
  payload: PayloadBanka,
  indexes: number[],
): PayloadBanka | null {
  const seen = new Set<string>(payload.tasks.map((t) => t.id));
  const tasks = indexes.flatMap((at) => {
    const source = taskAt(payload, at);
    if (source === undefined) return [];
    const id = analogOf(katalog, source.p, source.id, seen);
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

export const ZAMENY = new WeakMap<PayloadBanka, Record<number, TaskBanka>>();

/** Задача тренировки с учётом замены. */
export function taskAt(payload: PayloadBanka, at: number): TaskBanka | undefined {
  return ZAMENY.get(payload)?.[at] ?? payload.tasks[at];
}
