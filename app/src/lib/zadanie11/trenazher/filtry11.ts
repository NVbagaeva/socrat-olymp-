/**
 * Тренажёр №11 на общей панели фильтров (docs/trenazher-filtry/):
 * конфиг фильтров и конечный список задач.
 *
 * Темы — разделы №11 (проценты, смеси, движение…), чипы — подтипы.
 * Задачи — открытый банк, разминка и аналоги из пула: у каждого
 * подтипа их не меньше десяти, поэтому числа на чипах честные.
 * «Похожая задача» и «Перерешать» дают новую задачу генератором
 * подтипа (trenazher/zadacha.ts), сверх списка.
 */

import { GENERATOR11_LEVELS } from '../../../content/generator11';
import type { TrenazherConfig, ZadachaRef } from '../../trenazher/types';
import type { DannyeTrenazhera } from './dannye';
import { klyuchZadachi, type UslovieBanka, type ZadachaPlan } from './sessiya';

export function trenazherConfig11(dannye: DannyeTrenazhera): TrenazherConfig {
  return {
    razdel: '11',
    scope: '11',
    temy: dannye.razdely.map((r) => ({
      id: r.id,
      title: r.nazvanie,
      short: r.nazvanie.charAt(0).toLowerCase() + r.nazvanie.slice(1),
      podtipy: r.podtipy.map((p) => ({ id: p.id, code: p.kod, title: p.title })),
    })),
    urovni: GENERATOR11_LEVELS.map((l) => ({ uroven: l.level, words: l.words })),
    istochnik: true,
  };
}

function planBanka(b: UslovieBanka): ZadachaPlan {
  return {
    vid: b.analog !== undefined ? 'analog' : b.razminka ? 'razminka' : 'bank',
    no: b.no,
    id: b.id,
  };
}

/** Задачи тренажёра: банк — «открытый банк ФИПИ», разминка и аналоги — «не из банка». */
export function zadachi11(dannye: DannyeTrenazhera): ZadachaRef[] {
  const level = new Map(dannye.razdely.flatMap((r) => r.podtipy.map((p) => [p.id, p.level])));
  return dannye.bank.map((b) => {
    const plan = planBanka(b);
    return {
      key: klyuchZadachi(plan),
      podtip: b.id,
      uroven: level.get(b.id) ?? null,
      istochnik: plan.vid === 'bank' ? 'fipi' : 'new',
    };
  });
}

/** Ключ новой задачи генератора: подтип и «n», seed — у задания. */
export function klyuchNovoy(id: string): string {
  return `${id}|n`;
}

/**
 * План задачи по ключу: «DP-07|b12» — задача банка, «|r», «|a» —
 * разминка и аналог, «|n…» — новая задача генератора с seed (из
 * ключа или, если в ключе пусто, переданный). Чужой ключ — null.
 */
export function planPoKlyuchu(key: string, seed: string): ZadachaPlan | null {
  const [id = '', hvost = ''] = key.split('|');
  if (id === '' || hvost === '') return null;
  if (hvost.startsWith('n')) {
    const svoy = hvost.slice(1);
    return { vid: 'new', id, seed: svoy === '' ? seed : svoy };
  }
  const vid =
    hvost[0] === 'b' ? 'bank' : hvost[0] === 'r' ? 'razminka' : hvost[0] === 'a' ? 'analog' : null;
  const no = Number(hvost.slice(1));
  return vid === null || !Number.isInteger(no) ? null : { vid, no, id };
}
