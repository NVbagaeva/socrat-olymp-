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
  /* Показательная функция. */
  'P12E-1': 'pokaz-osnovanie', 'P12E-2': 'pokaz-znachenie', 'P12E-3': 'pokaz-sdvig-vverh',
  'P12E-4': 'pokaz-sdvig-vbok', 'P12E-5': 'pokaz-argument',
  '12E.A': 'pokaz-znachenie', '12E.B': 'pokaz-sdvig-vverh', '12E.C': 'pokaz-argument',
  '12E.D': 'pokaz-sdvig-vbok',
  /* Логарифмическая функция. */
  'P12L-1': 'log-osnovanie', 'P12L-2': 'log-znachenie', 'P12L-3': 'log-sdvig-vverh',
  'P12L-4': 'log-sdvig-vbok', 'P12L-5': 'log-argument',
  '12L.A': 'log-znachenie', '12L.B': 'log-sdvig-vverh', '12L.C': 'log-argument',
  '12L.D': 'log-sdvig-vbok', '12L.E': 'log-argument',
  /* Тригонометрические функции. */
  'P12T-1': 'trig-cos', 'P12T-2': 'trig-sin', 'P12T-3': 'trig-tg', 'P12T-4': 'trig-sistema',
  'P12T-5': 'trig-polovina',
  '12T.A': 'trig-cos', '12T.B': 'trig-cos', '12T.C': 'trig-tg', '12T.D': 'trig-tg',
  '12T.E': 'trig-sin', '12T.F': 'trig-sin',
};

/* Подтема набора: по префиксу идентификатора. */
function typeOf(setId: string): string {
  if (/^(P12S-|12S\.)/.test(setId)) {
    return 'irrational';
  }
  if (/^(P12E-|12E\.)/.test(setId)) {
    return 'exponential';
  }
  if (/^(P12L-|12L\.)/.test(setId)) {
    return 'logarithmic';
  }
  if (/^(P12T-|12T\.)/.test(setId)) {
    return 'trigonometric';
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
