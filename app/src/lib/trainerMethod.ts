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
import { titleHtml } from '@/lib/prep';
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
  /* Гипербола: опорные навыки один в один, прототипы — по приёму. */
  'P12R-1': 'koef-k', 'P12R-2': 'sdvig-vverh', 'P12R-3': 'sdvig-vbok', 'P12R-4': 'sdvig-oba',
  'P12R-5': 'vse-koef', 'P12R-6': 'celaya-chast', 'P12R-7': 'znachenie', 'P12R-8': 'argument',
  'P12R-9': 'pryamaya', 'P12R-10': 'abscissa-b', 'P12R-11': 'ordinata-b',
  '12R.A': 'znachenie', '12R.B': 'argument', '12R.C': 'znachenie', '12R.D': 'argument',
  '12R.E': 'celaya-chast', '12R.F': 'celaya-chast', '12R.G': 'abscissa-b',
  '12R.H': 'ordinata-b', '12R.I': 'koef-k', '12R.J': 'celaya-chast',
  /* График корня. */
  'P12S-1': 'koren-k', 'P12S-2': 'koren-znachenie', 'P12S-3': 'koren-argument',
  'P12S-4': 'koren-pryamaya', 'P12S-5': 'koren-peresechenie',
  '12S.A': 'koren-znachenie', '12S.B': 'koren-argument', '12S.C': 'koren-peresechenie',
  '12S.D': 'koren-peresechenie',
};

/* Подтема набора: по префиксу идентификатора. */
function typeOf(setId: string): string {
  if (/^(P12S-|12S\.)/.test(setId)) {
    return 'irrational';
  }
  return /^(P12R-|12R\.)/.test(setId) ? 'rational' : 'quadratic';
}

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
    : prepSkillsFor(typeOf(setId)).find((item) => item.id === id);
  const method = id === undefined || skill === undefined ? null : {
    /* Название и приём — с формулами: набираются KaTeX здесь же. */
    title: titleHtml(skill.title),
    tip: titleHtml(skill.tip),
    svg: renderGraph(prepSkillScene(id)) as string,
  };
  cache.set(setId, method);
  return method;
}
