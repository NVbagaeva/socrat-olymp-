import type { Rezhim, Zadanie } from '@/content/veroyatnost';
import { fingerprint } from '@/lib/secret';
import { isRecord } from '@/lib/trainerSession/restore';
import type { Pool, PoolModel, UznayPool } from '@/lib/veroyatnost/pool';
import { klyuchZadachi } from '@/lib/veroyatnost/secret';
import type { RoundItem } from '@/lib/veroyatnost/useRound';
import { navykKind, zadachaId } from './metody';

/** Иллюстрация задачи: путь и подпись, если файл есть. */
type Illyustratsiya = { path: string; alt: string };

/**
 * Задача подхода №4 и №5 в том виде, в каком её получает экран.
 *
 * В хранилище задача лежит ссылкой на банк страницы — прототип, номер
 * варианта и контрольная подпись (см. upakovat/raspakovat ниже): банк
 * «Все» весит мегабайты, а ссылки — десятки килобайт. Правильных
 * ответов открытым текстом тут нет — только то, что и так едет в
 * браузер.
 */
export interface SessiyaZadacha {
  /** «прототип:номер варианта» — как в списке ошибок. */
  id: string;
  /** Прототип (у «Узнай метод» — прототип или задача конспекта) и номер варианта в нём. */
  kind: string;
  n: number;
  /** Откуда задача: строка шапки (отработка) или ключ источника («Узнай метод»). */
  istochnik: string;
  uslovie: string;
  illustration?: Illyustratsiya;
  /** Отработка: ключ, отпечаток ответа и закрытый разбор. */
  klyuch: string;
  seal: string;
  steps: string;
  /** Отработка: закрытая пошаговая подсказка (если есть у прототипа). */
  podskazka?: string;
  /** Отработка: навык задачи (блок банка). У «Узнай метод» пусто. */
  metod: string;
  model?: PoolModel;
  /** «Узнай метод»: отпечаток метода и закрытый список признаков. */
  metodSeal: string;
  hints: string;
}

/** Задачи тренировки и её настройки: единый payload обоих заданий. */
export interface SessiyaPayload {
  zadanie: Zadanie;
  rezhim: Rezhim;
  /** Метод отработки (запасное название вида задачи на итогах). */
  metod: string;
  /** Подсказки: название метода в шапке и «Показать решение» до ответа. */
  podskazki: boolean;
  tasks: SessiyaZadacha[];
}

/** Задача банка страницы по прототипу и номеру варианта; нет в банке — null. */
function zadachaBanka(
  kindId: string,
  n: number,
  rezhim: Rezhim,
  pool: Pool,
  uznay: UznayPool,
): SessiyaZadacha | null {
  const id = zadachaId(kindId, n);
  if (rezhim === 'uznay') {
    const kind = uznay.kinds.find((k) => k.id === kindId);
    const v = kind?.variants.find((x) => x.n === n);
    if (kind === undefined || v === undefined) {
      return null;
    }
    return {
      id,
      kind: kind.id,
      n: v.n,
      istochnik: kind.istochnik,
      uslovie: v.uslovie,
      ...(v.illustration === undefined ? {} : { illustration: v.illustration }),
      klyuch: '',
      seal: '',
      steps: '',
      metod: '',
      metodSeal: v.metodSeal,
      hints: v.hints,
    };
  }
  const kind = pool.kinds.find((k) => k.id === kindId);
  const v = kind?.variants.find((x) => x.n === n);
  if (kind === undefined || v === undefined) {
    return null;
  }
  return {
    id,
    kind: kind.id,
    n: v.n,
    istochnik: kind.istochnik,
    uslovie: v.uslovie,
    klyuch: klyuchZadachi(kind.id, v.n),
    seal: v.seal,
    steps: v.steps,
    ...(v.podskazka === undefined ? {} : { podskazka: v.podskazka }),
    metod: navykKind(kind),
    ...(v.model === undefined ? {} : { model: v.model }),
    metodSeal: '',
    hints: '',
  };
}

/** Подход банка → задачи сессии. Задач, которых в банке нет, не бывает: пропускаются. */
export function zadachiPodhoda(
  round: readonly RoundItem[],
  rezhim: Rezhim,
  pool: Pool,
  uznay: UznayPool,
): SessiyaZadacha[] {
  return round.flatMap((item) => zadachaBanka(item.kind, item.n, rezhim, pool, uznay) ?? []);
}

/**
 * «Похожие задачи»: на каждую задачу с ошибкой — другой вариант того
 * же прототипа, которого в тренировке не было. У прототипа все
 * варианты уже прошли — задача пропускается; не осталось ни одной —
 * null, аналогов нет.
 */
export function pohozhieZadachi(
  payload: SessiyaPayload,
  indexes: readonly number[],
  pool: Pool,
  uznay: UznayPool,
): SessiyaPayload | null {
  const byli = new Set(payload.tasks.map((t) => t.id));
  const kinds: readonly { id: string; variants: readonly { n: number }[] }[] =
    payload.rezhim === 'uznay' ? uznay.kinds : pool.kinds;
  const tasks: SessiyaZadacha[] = [];
  for (const at of indexes) {
    const task = payload.tasks[at];
    const kind = task === undefined ? undefined : kinds.find((k) => k.id === task.kind);
    if (kind === undefined) {
      continue;
    }
    const svobodnye = kind.variants.filter((v) => !byli.has(zadachaId(kind.id, v.n)));
    const v = svobodnye[Math.floor(Math.random() * svobodnye.length)];
    const next = v === undefined ? null : zadachaBanka(kind.id, v.n, payload.rezhim, pool, uznay);
    if (next !== null) {
      byli.add(next.id);
      tasks.push(next);
    }
  }
  return tasks.length === 0 ? null : { ...payload, tasks };
}

const REZHIMY_SESSII: readonly Rezhim[] = ['practice', 'mixed', 'mistakes', 'uznay'];

/* ── Запись в хранилище: ссылки на банк страницы ─────────────────── */

/** Задача в записи: прототип, номер варианта, контрольная подпись. */
type Ssylka = [kind: string, n: number, podpis: string];

/** Тренировка в записи: настройки и ссылки на задачи банка. */
interface Upakovano {
  zadanie: Zadanie;
  rezhim: Rezhim;
  metod: string;
  podskazki: boolean;
  tasks: Ssylka[];
}

/**
 * Контрольная подпись задачи: отпечаток условия и отпечатка ответа
 * (у «Узнай метод» — отпечатка метода). Банк собирается вместе с
 * сайтом: если после обновления вариант с тем же номером стал другой
 * задачей, подпись не сойдётся и тренировка сбросится как устаревшая,
 * а не подсунет ученику чужое условие посреди подхода.
 */
function podpis(task: SessiyaZadacha): string {
  return fingerprint('vtr-sess:', `${task.uslovie}\u0000${task.seal}\u0000${task.metodSeal}`);
}

/** Задачи → ссылки на банк для записи (pack оболочки). */
export function upakovat(payload: SessiyaPayload): Upakovano {
  return {
    zadanie: payload.zadanie,
    rezhim: payload.rezhim,
    metod: payload.metod,
    podskazki: payload.podskazki,
    tasks: payload.tasks.map((t) => [t.kind, t.n, podpis(t)]),
  };
}

function isSsylka(value: unknown): value is Ssylka {
  return (
    Array.isArray(value) &&
    value.length === 3 &&
    typeof value[0] === 'string' &&
    typeof value[1] === 'number' &&
    typeof value[2] === 'string'
  );
}

/**
 * Ссылки из записи → задачи из банка страницы (unpack оболочки). Задачи
 * нет в банке или подпись не сошлась — null: тренировка устарела.
 */
export function raspakovat(packed: unknown, pool: Pool, uznay: UznayPool): SessiyaPayload | null {
  if (!isRecord(packed) || !Array.isArray(packed['tasks']) || !packed['tasks'].every(isSsylka)) {
    return null;
  }
  const rezhim = packed['rezhim'];
  if (typeof rezhim !== 'string' || !(REZHIMY_SESSII as readonly string[]).includes(rezhim)) {
    return null;
  }
  const tasks: SessiyaZadacha[] = [];
  for (const [kind, n, sig] of packed['tasks'] as Ssylka[]) {
    const task = zadachaBanka(kind, n, rezhim as Rezhim, pool, uznay);
    if (task === null || podpis(task) !== sig) {
      return null;
    }
    tasks.push(task);
  }
  const payload: unknown = { ...packed, tasks };
  return isSessiyaPayload(payload) ? payload : null;
}

function isIllyustratsiya(value: unknown): value is Illyustratsiya {
  return isRecord(value) && typeof value['path'] === 'string' && typeof value['alt'] === 'string';
}

function isModel(value: unknown): value is PoolModel {
  return (
    isRecord(value) &&
    typeof value['method'] === 'string' &&
    (value['illustration'] === undefined || isIllyustratsiya(value['illustration']))
  );
}

function isZadacha(value: unknown): value is SessiyaZadacha {
  return (
    isRecord(value) &&
    typeof value['id'] === 'string' &&
    typeof value['kind'] === 'string' &&
    typeof value['n'] === 'number' &&
    typeof value['istochnik'] === 'string' &&
    typeof value['uslovie'] === 'string' &&
    typeof value['klyuch'] === 'string' &&
    typeof value['seal'] === 'string' &&
    typeof value['steps'] === 'string' &&
    typeof value['metod'] === 'string' &&
    typeof value['metodSeal'] === 'string' &&
    typeof value['hints'] === 'string' &&
    (value['podskazka'] === undefined || typeof value['podskazka'] === 'string') &&
    (value['illustration'] === undefined || isIllyustratsiya(value['illustration'])) &&
    (value['model'] === undefined || isModel(value['model']))
  );
}

/** Проверка формата при чтении из хранилища: чужое и повреждённое отсекается. */
export function isSessiyaPayload(value: unknown): value is SessiyaPayload {
  if (!isRecord(value)) {
    return false;
  }
  const { zadanie, rezhim, tasks } = value;
  if (
    (zadanie !== 4 && zadanie !== 5) ||
    typeof rezhim !== 'string' ||
    !(REZHIMY_SESSII as readonly string[]).includes(rezhim) ||
    typeof value['metod'] !== 'string' ||
    typeof value['podskazki'] !== 'boolean' ||
    !Array.isArray(tasks) ||
    tasks.length === 0 ||
    !tasks.every(isZadacha)
  ) {
    return false;
  }
  /* «Узнай метод» держится на отпечатке метода, остальные режимы — на ответе. */
  const uznay = rezhim === 'uznay';
  return (tasks as SessiyaZadacha[]).every((t) => (uznay ? t.metodSeal !== '' : t.seal !== ''));
}
