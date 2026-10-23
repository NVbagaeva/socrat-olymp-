/**
 * Тренажёр задания №1: из чего собирается тренировка.
 *
 * Модуль лёгкий — без движка чертежей и решений: им пользуется экран
 * выбора (счётчики «в банке», предупреждение «в банке только N
 * задач») и сборка плана тренировки. Задача в плане — ссылка: номер
 * задачи банка, номер аналога или прототип и seed новой задачи. Сами
 * задачи собирает trenazher/zadacha.ts уже после «Начать».
 *
 * Устройство — как у тренажёра №11 (lib/zadanie11/trenazher). Тип
 * задачи («подтип» №11) — прототип, раздел — блок I–X. Источник —
 * открытый банк (по умолчанию), банк + новые, только новые. Блок X
 * — темы не из открытого банка: в режиме «только банк» его нет, как
 * разминки у №11.
 */

import { rngOf } from '../../vychisleniya/rng';
import type { Blok, Nabor } from '../stseny/dsl';

export type Istochnik = 'bank' | 'mix' | 'new';
export type Level = 1 | 2 | 3;

/** Прототип для экрана выбора: всё, что нужно без движка. */
export interface PodtipInfo {
  /** Ключ: «p05». */
  id: string;
  proto: number;
  /** Код на сайте: «05». */
  kod: string;
  section: Blok;
  /** Название с формулами в $…$. */
  title: string;
  level: Level;
  /** Задач открытого банка. */
  vBanke: number;
}

export interface RazdelInfo {
  id: Blok;
  nazvanie: string;
  podtipy: PodtipInfo[];
}

/** Задача банка или аналог — числа условия, без ответа. */
export interface UslovieBanka {
  /** Номер: задача Блока 1 ФИПИ (1–214) или аналог (1000 + …). */
  no: number;
  id: string;
  params: Nabor;
  /** Аналог из пула: «новая» задача с готовыми числами. */
  analog: boolean;
}

export type ZadachaPlan =
  { vid: 'bank' | 'analog'; no: number; id: string } | { vid: 'new'; id: string; seed: string };

export interface Zapros {
  podtipy: string[];
  istochnik: Istochnik;
  count: number;
}

/** Ключ прототипа: 5 → «p05». */
export function klyuchProto(proto: number): string {
  return `p${String(proto).padStart(2, '0')}`;
}

/** Прототип по ключу: «p05» → 5. */
export function protoKlyucha(id: string): number {
  return Number(id.slice(1));
}

/** Номер аналога в списке банка тренажёра: 1000 + прототип·100 + номер (до 99 аналогов). */
export function nomerAnaloga(proto: number, no: number): number {
  return 1000 + proto * 100 + (no - 1);
}

/** Ключ задачи: прототип и откуда она — для списка ошибок и статистики. */
export function klyuchZadachi(plan: ZadachaPlan): string {
  if (plan.vid === 'new') {
    return `${plan.id}|n${plan.seed}`;
  }
  return `${plan.id}|${plan.vid === 'bank' ? 'b' : 'a'}${plan.no}`;
}

/** Прототип по ключу задачи из списка ошибок. */
export function podtipKlyucha(key: string): string {
  return key.split('|')[0] ?? '';
}

/** Задачи открытого банка для прототипов (в режиме «только новые» — нет). */
export function bankDlya(
  podtipy: readonly string[],
  bank: readonly UslovieBanka[],
  istochnik: Istochnik,
): UslovieBanka[] {
  if (istochnik === 'new') {
    return [];
  }
  const nuzhny = new Set(podtipy);
  return bank.filter((b) => nuzhny.has(b.id) && !b.analog);
}

/** Аналоги для прототипов: «новые» задачи с готовыми числами. */
export function analogiDlya(
  podtipy: readonly string[],
  bank: readonly UslovieBanka[],
): UslovieBanka[] {
  const nuzhny = new Set(podtipy);
  return bank.filter((b) => nuzhny.has(b.id) && b.analog);
}

/**
 * Перемешать задачи и чередовать прототипы: подряд не идут две
 * задачи одного прототипа, пока есть другие.
 */
function cheredovat<T extends { id: string }>(items: T[], r: ReturnType<typeof rngOf>): T[] {
  const gruppy = new Map<string, T[]>();
  for (const item of r.sample(items, items.length)) {
    gruppy.set(item.id, [...(gruppy.get(item.id) ?? []), item]);
  }
  const ochered = r.sample([...gruppy.keys()], gruppy.size);
  const out: T[] = [];
  while (out.length < items.length) {
    for (const id of ochered) {
      const next = gruppy.get(id)?.shift();
      if (next !== undefined) {
        out.push(next);
      }
    }
  }
  return out;
}

/**
 * План тренировки. «Только банк» — задачи банка без повторов (их
 * может оказаться меньше, чем просили: экран выбора предупреждает);
 * «только новые» — аналоги, а когда они кончились, новые задачи
 * генератора, прототипы по кругу; «банк + новые» — половина из
 * банка, остальное новые, вперемежку.
 */
export function planSessii(
  zapros: Zapros,
  bank: readonly UslovieBanka[],
  seed: string,
): ZadachaPlan[] {
  const r = rngOf(`z1-trenazher|${seed}`);
  /* Прототипы без задач банка (блок X) в «только банк» отсеял vTrenirovke. */
  const podtipy = [...zapros.podtipy];
  if (podtipy.length === 0 || zapros.count <= 0) {
    return [];
  }
  const izBanka: ZadachaPlan[] = cheredovat(bankDlya(podtipy, bank, zapros.istochnik), r).map(
    (b) => ({ vid: 'bank', no: b.no, id: b.id }),
  );
  const vseAnalogi = analogiDlya(podtipy, bank);
  const pul = new Map<string, UslovieBanka[]>();
  for (const a of r.sample(vseAnalogi, vseAnalogi.length)) {
    pul.set(a.id, [...(pul.get(a.id) ?? []), a]);
  }
  const novye = (n: number): ZadachaPlan[] => {
    const krug = r.sample(podtipy, podtipy.length);
    return Array.from({ length: n }, (_, i) => {
      const id = krug[i % krug.length] as string;
      const a = pul.get(id)?.shift();
      const plan: ZadachaPlan =
        a === undefined
          ? { vid: 'new', id, seed: `${seed}-${i}` }
          : { vid: 'analog', no: a.no, id };
      return plan;
    });
  };
  if (zapros.istochnik === 'bank') {
    return izBanka.slice(0, zapros.count);
  }
  if (zapros.istochnik === 'new') {
    return novye(zapros.count);
  }
  const bankovykh = Math.min(izBanka.length, Math.ceil(zapros.count / 2));
  const a = izBanka.slice(0, bankovykh);
  const b = novye(zapros.count - bankovykh);
  const out: ZadachaPlan[] = [];
  for (let i = 0; out.length < zapros.count; i += 1) {
    const x = a[i];
    const y = b[i];
    if (x !== undefined) out.push(x);
    if (y !== undefined && out.length < zapros.count) out.push(y);
    if (x === undefined && y === undefined) break;
  }
  return out;
}

/** Примерное время тренировки, минуты: по уровням выбранных прототипов. */
export function primernoeVremya(levels: readonly Level[], count: number): [number, number] {
  if (levels.length === 0 || count === 0) {
    return [0, 0];
  }
  const MINUT: Record<Level, number> = { 1: 1, 2: 2, 3: 3 };
  const sred = levels.reduce((s, l) => s + MINUT[l], 0) / levels.length;
  const t = sred * count;
  const okrugl = (x: number) => Math.max(5, Math.round(x / 5) * 5);
  const lo = okrugl(t * 0.8);
  const hi = Math.max(lo + 5, okrugl(t * 1.2));
  return [lo, hi];
}

/** Настройки тренировки: живут, пока открыта вкладка браузера. */
export interface Nastroyki {
  istochnik: Istochnik;
  podtipy: string[];
  count: number;
  /** 0 — все уровни, иначе только этот. */
  uroven: 0 | Level;
  podskazki: boolean;
}

/** Прототипы, которые реально войдут в тренировку: уровень и источник. */
export function vTrenirovke(n: Nastroyki, vse: readonly PodtipInfo[]): PodtipInfo[] {
  const nuzhny = new Set(n.podtipy);
  return vse.filter(
    (p) =>
      nuzhny.has(p.id) &&
      (n.uroven === 0 || p.level === n.uroven) &&
      !(n.istochnik === 'bank' && p.vBanke === 0),
  );
}
