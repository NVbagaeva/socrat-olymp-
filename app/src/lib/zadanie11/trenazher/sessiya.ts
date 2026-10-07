/**
 * Тренажёр задания №11: из чего собирается тренировка.
 *
 * Модуль лёгкий — без движка решений: им пользуется экран выбора
 * (счётчики «в банке», предупреждение «в банке только N задач») и
 * сборка плана тренировки. Задача в плане — ссылка: номер задачи
 * банка или подтип и seed новой задачи. Сами задачи собирает
 * trenazher/zadacha.ts уже после нажатия «Начать».
 *
 * Источник — переключатель из трёх положений: только открытый банк
 * (по умолчанию), банк + новые, только новые. Разминка (РЗ) — не
 * открытый банк: в режиме «только банк» её нет, в смешанном её
 * задачи идут с пометкой «разминка».
 */

import { rngOf } from '../../vychisleniya/rng';
import type { Level, Params, SectionId } from '../types';

export type Istochnik = 'bank' | 'mix' | 'new';

/** Подтип для экрана выбора: всё, что нужно без движка. */
export interface PodtipInfo {
  id: string;
  /** Код на сайте: «ДП-07». */
  kod: string;
  section: SectionId;
  title: string;
  level: Level;
  keywords: string[];
  /** Задач открытого банка (у РЗ — задач разминки). */
  vBanke: number;
}

export interface RazdelInfo {
  id: SectionId;
  kod: string;
  nazvanie: string;
  podtipy: PodtipInfo[];
}

/** Условие задачи банка или разминки — без ответа. */
export interface UslovieBanka {
  /** Номер в списке: по нему задача воспроизводится. */
  no: number;
  id: string;
  params: Params;
  razminka: boolean;
  /**
   * Аналог из пула: «новая» задача с готовым условием. Номер аналога
   * («ДП-07-a01»), его текст и метка сюжета; ответа нет и здесь.
   */
  analog?: { kod: string; tekst: string; plotTag: string };
}

export type ZadachaPlan =
  | { vid: 'bank' | 'razminka' | 'analog'; no: number; id: string }
  | { vid: 'new'; id: string; seed: string };

export interface Zapros {
  podtipy: string[];
  istochnik: Istochnik;
  count: number;
}

/** Ключ задачи: подтип и откуда она — для списка ошибок и статистики. */
export function klyuchZadachi(plan: ZadachaPlan): string {
  if (plan.vid === 'new') {
    return `${plan.id}|n${plan.seed}`;
  }
  return `${plan.id}|${plan.vid === 'bank' ? 'b' : plan.vid === 'analog' ? 'a' : 'r'}${plan.no}`;
}

/** Подтип по ключу задачи из списка ошибок. */
export function podtipKlyucha(key: string): string {
  return key.split('|')[0] ?? '';
}

/** Задачи банка (и разминки — кроме режима «только банк») для подтипов. */
export function bankDlya(
  podtipy: readonly string[],
  bank: readonly UslovieBanka[],
  istochnik: Istochnik,
): UslovieBanka[] {
  if (istochnik === 'new') {
    return [];
  }
  const nuzhny = new Set(podtipy);
  return bank.filter(
    (b) => nuzhny.has(b.id) && b.analog === undefined && (istochnik === 'mix' || !b.razminka),
  );
}

/** Аналоги из пула для подтипов: «новые» задачи с готовым условием. */
export function analogiDlya(
  podtipy: readonly string[],
  bank: readonly UslovieBanka[],
): UslovieBanka[] {
  const nuzhny = new Set(podtipy);
  return bank.filter((b) => nuzhny.has(b.id) && b.analog !== undefined);
}

/**
 * Перемешать задачи и чередовать подтипы: подряд не идут две задачи
 * одного подтипа, пока есть другие.
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
 * может оказаться меньше, чем просили: экран выбора об этом
 * предупреждает); «только новые» — новые задачи по кругу подтипов;
 * «банк + новые» — половина из банка, остальное новые, вперемежку.
 */
export function planSessii(
  zapros: Zapros,
  bank: readonly UslovieBanka[],
  seed: string,
): ZadachaPlan[] {
  const r = rngOf(`z11-trenazher|${seed}`);
  const podtipy =
    zapros.istochnik === 'bank'
      ? zapros.podtipy.filter((id) => !id.startsWith('RZ-'))
      : [...zapros.podtipy];
  if (podtipy.length === 0 || zapros.count <= 0) {
    return [];
  }
  const izBanka: ZadachaPlan[] = cheredovat(bankDlya(podtipy, bank, zapros.istochnik), r).map(
    (b) => ({ vid: b.razminka ? 'razminka' : 'bank', no: b.no, id: b.id }),
  );
  /* Новые задачи: сначала аналоги из пула (без повторов), потом —
     генератор на лету. Подтипы идут по кругу. */
  const pul = new Map<string, UslovieBanka[]>();
  for (const a of r.sample(analogiDlya(podtipy, bank), analogiDlya(podtipy, bank).length)) {
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

/** Примерное время тренировки, минуты: по уровням выбранных подтипов. */
export function primernoeVremya(levels: readonly Level[], count: number): [number, number] {
  if (levels.length === 0 || count === 0) {
    return [0, 0];
  }
  const MINUT: Record<Level, number> = { 1: 1.5, 2: 2.5, 3: 4 };
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

/** Подтипы, которые реально войдут в тренировку: уровень и источник. */
export function vTrenirovke(n: Nastroyki, vse: readonly PodtipInfo[]): PodtipInfo[] {
  const nuzhny = new Set(n.podtipy);
  return vse.filter(
    (p) =>
      nuzhny.has(p.id) &&
      (n.uroven === 0 || p.level === n.uroven) &&
      !(n.istochnik === 'bank' && p.section === 'RZ'),
  );
}
