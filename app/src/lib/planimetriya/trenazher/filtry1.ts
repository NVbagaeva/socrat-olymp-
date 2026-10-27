/**
 * Тренажёр №1 на общей панели фильтров (docs/trenazher-filtry/):
 * конфиг фильтров и конечный список задач. Устройство — как у №11
 * (lib/zadanie11/trenazher/filtry11.ts).
 *
 * Темы — блоки I–X, чипы — прототипы. Задачи — открытый банк ФИПИ и
 * аналоги (у каждого прототипа их не меньше двадцати), поэтому числа
 * на чипах честные. «Похожая задача» и «Перерешать» дают новую задачу
 * генератором прототипа (trenazher/zadacha.ts), сверх списка.
 */

import { GENERATOR1_LEVELS } from '../../../content/generator1';
import type { TrenazherConfig, ZadachaRef } from '../../trenazher/types';
import type { DannyeTrenazhera1 } from './dannye';
import { klyuchZadachi, type ZadachaPlan } from './sessiya';

/** Название без разметки формул — для строки-сводки и списка итогов. */
function bezFormul(text: string): string {
  return text.replace(/\$([^$]*)\$/g, (_, tex: string) => tex.replace(/\\[a-z]+\s*/gi, '').trim());
}

/**
 * Конфиг фильтров. Названия с формулами набирает typeset (KaTeX) —
 * его передаёт страница: на сборке, чтобы движок формул не попал в
 * браузер вместе с карточкой задачи, которая берёт отсюда ключи.
 */
export function trenazherConfig1(
  dannye: DannyeTrenazhera1,
  typeset: (text: string) => string,
): TrenazherConfig {
  return {
    razdel: '1',
    scope: '1',
    temy: dannye.razdely.map((r) => ({
      id: r.id,
      title: r.nazvanie,
      short: r.nazvanie.charAt(0).toLowerCase() + r.nazvanie.slice(1),
      podtipy: r.podtipy.map((p) => ({
        id: p.id,
        code: p.kod,
        title: bezFormul(p.title),
        ...(p.title.includes('$') ? { titleHtml: typeset(p.title) } : {}),
      })),
    })),
    urovni: GENERATOR1_LEVELS.map((l) => ({ uroven: l.level, words: l.words })),
    istochnik: true,
  };
}

/** Задачи тренажёра: банк — «открытый банк ФИПИ», аналоги — «не из банка». */
export function zadachi1(dannye: DannyeTrenazhera1): ZadachaRef[] {
  const level = new Map(dannye.razdely.flatMap((r) => r.podtipy.map((p) => [p.id, p.level])));
  return dannye.bank.map((b) => {
    const plan: ZadachaPlan = { vid: b.analog ? 'analog' : 'bank', no: b.no, id: b.id };
    return {
      key: klyuchZadachi(plan),
      podtip: b.id,
      uroven: level.get(b.id) ?? null,
      istochnik: b.analog ? 'new' : 'fipi',
    };
  });
}

/** Ключ новой задачи генератора: прототип и «n», seed — у задания. */
export function klyuchNovoy1(id: string): string {
  return `${id}|n`;
}

/**
 * План задачи по ключу: «p05|b12» — задача банка, «|a» — аналог,
 * «|n…» — новая задача генератора с seed (из ключа или, если в ключе
 * пусто, переданный). Чужой ключ — null.
 */
export function planPoKlyuchu1(key: string, seed: string): ZadachaPlan | null {
  const [id = '', hvost = ''] = key.split('|');
  if (!/^p\d{2}$/.test(id) || hvost === '') return null;
  if (hvost.startsWith('n')) {
    const svoy = hvost.slice(1);
    return { vid: 'new', id, seed: svoy === '' ? seed : svoy };
  }
  const vid = hvost[0] === 'b' ? 'bank' : hvost[0] === 'a' ? 'analog' : null;
  const no = Number(hvost.slice(1));
  return vid === null || !Number.isInteger(no) ? null : { vid, no, id };
}
