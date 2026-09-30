/**
 * Рисунок метода под разбором тренажёра.
 *
 * Расхождение подтемы «Квадратичная функция»: после ответа ученик
 * видит не только разбор, но и чем эта задача решается — название
 * приёма, миниатюру и одну строку о том, на что смотреть. У линейной
 * подтемы этого нет, и её экран не меняется.
 *
 * Название и приём берутся у навыка (content/prepSkills.ts),
 * миниатюра — у той же сцены, что стоит на карточке навыка
 * (lib/scenes.ts). Второго списка методов здесь нет: набор движка
 * знает свой навык, навык знает свой текст.
 */

import { prepSkillsFor, type PrepSkillId } from '@/content/prepSkills';
import { prepSkillScene } from '@/lib/scenes';
import { renderGraph } from '@/lib/graph/renderer.js';
import type { TrainerMethod } from '@/lib/trainer';

/** Набор движка → навык подтемы. Девять к девяти, один в один. */
const SKILL_BY_SET: Record<string, PrepSkillId> = {
  'P12Q-1': 'sign-a', '12Q.A': 'sign-a',
  'P12Q-2': 'value-a', '12Q.B': 'value-a',
  'P12Q-3': 'value-c', '12Q.C': 'value-c',
  'P12Q-4': 'value-b', '12Q.D': 'value-b',
  'P12Q-5': 'value-at', '12Q.E': 'value-at',
  'P12Q-6': 'argument-for', '12Q.F': 'argument-for',
  'P12Q-7': 'formula', '12Q.G': 'formula',
  'P12Q-8': 'cross-line', '12Q.H': 'cross-line',
  'P12Q-9': 'cross-parabola', '12Q.I': 'cross-parabola',
};

/* Миниатюра одна на навык и от задачи не зависит: рисуется один раз
   и дальше берётся из памяти. Сессия тренажёра — десятки задач, и
   перерисовывать один и тот же чертёж на каждую незачем. */
const cache = new Map<string, TrainerMethod | null>();

export function methodFor(setId: string): TrainerMethod | null {
  const ready = cache.get(setId);
  if (ready !== undefined) {
    return ready;
  }
  const id = SKILL_BY_SET[setId];
  const skill = id === undefined
    ? undefined
    : prepSkillsFor('quadratic').find((item) => item.id === id);
  const method = id === undefined || skill === undefined ? null : {
    title: skill.title,
    tip: skill.tip,
    svg: renderGraph(prepSkillScene(id)) as string,
  };
  cache.set(setId, method);
  return method;
}
