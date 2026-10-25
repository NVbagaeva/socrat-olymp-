/**
 * Тренажёр №12 на общей панели фильтров: конфиг и список задач.
 * Собирается на сервере из тех же данных движка graph/, что и конфиг
 * генератора (generator12.ts): в браузер уходят названия и короткий
 * список шаблонов задач, данные прототипов — нет.
 *
 * Задача списка — шаблон задачи набора («12Q.B-07»): числа в нём
 * движок даёт новые на каждом seed. Поэтому числа на чипах честные
 * (748 шаблонов на все типы), а «Похожая задача» — тот же шаблон с
 * другими числами.
 */

import { skillLevelsFor, skillTitle } from '@/content/skills12';
import { functionTypes } from '@/data/functionTypes';
import { prototypes } from '@/lib/graph/data/index.js';
import { manifest } from '@/lib/generator/manifest';
import { typeset } from '@/lib/tex';
import type { FiltrTema, TrenazherConfig, Uroven, ZadachaRef } from '@/lib/trenazher/types';
import { isFipiTask, type RawSet } from './fipi';

const UROVEN: Record<string, Uroven> = { lucky: 1, unlucky: 2 };

interface RawTask12 {
  id: string;
  level?: string;
  answerRule?: string;
  answerType?: string;
  source?: string;
}

const SETS = prototypes as unknown as (RawSet & { tasks: RawTask12[] })[];

/** «График — парабола» → «парабола». */
function korotko(graphName: string, title: string): string {
  const m = /—\s*(.+)$/.exec(graphName);
  return (m?.[1] ?? title).trim();
}

/** Типы функций тренажёра: все активные или один. */
function tipy(tip?: string): string[] {
  return functionTypes
    .filter((t) => t.status === 'active' && (tip === undefined || t.id === tip))
    .map((t) => t.id);
}

function tema(typeId: string): FiltrTema | null {
  const type = functionTypes.find((t) => t.id === typeId);
  const family = manifest.families.find((f) => f.id === typeId);
  if (type === undefined || family === undefined) return null;
  const podtipy = family.skills
    .filter((s) => s.kind === 'prototype')
    .map((s) => {
      const title = skillTitle[s.id] ?? s.id;
      return { id: s.id, code: s.id, title: title.replace(/\$/g, ''), titleHtml: typeset(title) };
    });
  return podtipy.length === 0
    ? null
    : { id: type.id, title: type.title, short: korotko(type.graphName, type.title), podtipy };
}

/**
 * Конфиг тренажёра №12. tip — вкладка подтемы (один тип, подписи
 * уровней — её); без него — тренажёр по всем типам.
 */
export function trenazherConfig12(tip?: string): TrenazherConfig {
  const temy = tipy(tip).flatMap((id) => tema(id) ?? []);
  const levels = skillLevelsFor(tip ?? '');
  const refs = zadachi12(tip);
  return {
    razdel: '12',
    scope: tip === undefined ? '12' : `12:${tip}`,
    temy,
    urovni: levels.map((l) => ({ uroven: UROVEN[l.id] ?? 1, words: l.title })),
    istochnik: refs.some((r) => r.istochnik === 'fipi') && refs.some((r) => r.istochnik === 'new'),
  };
}

/**
 * Шаблоны задач тренажёра. Задачи с ответом выбором варианта — только
 * у подтем, где тренажёр их принимает (choiceAnswers): у остальных их
 * нечем проверить.
 */
export function zadachi12(tip?: string): ZadachaRef[] {
  const out: ZadachaRef[] = [];
  for (const typeId of tipy(tip)) {
    const type = functionTypes.find((t) => t.id === typeId);
    const family = manifest.families.find((f) => f.id === typeId);
    if (type === undefined || family === undefined) continue;
    for (const skill of family.skills.filter((s) => s.kind === 'prototype')) {
      const set = SETS.find((s) => s.id === skill.id);
      if (set === undefined) continue;
      for (const task of set.tasks) {
        const answerType = task.answerType ?? 'number';
        if (answerType !== 'number' && !(answerType === 'choice' && type.choiceAnswers === true)) {
          continue;
        }
        out.push({
          key: task.id,
          podtip: set.id,
          uroven: task.level === undefined ? null : (UROVEN[task.level] ?? null),
          istochnik: isFipiTask(set, task.id) ? 'fipi' : 'new',
          ...(task.answerRule === undefined ? {} : { pravilo: task.answerRule }),
        });
      }
    }
  }
  return out;
}

/** Подтема задачи по набору: для ссылок на теорию и опорные задачи. */
export function podtemaNabora(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const family of manifest.families) {
    for (const skill of family.skills) {
      out[skill.id] = family.id;
    }
  }
  return out;
}
