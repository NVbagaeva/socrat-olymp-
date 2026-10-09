/**
 * Разделы задания №12 для навигации: из того же списка подтем, что
 * карточки выбора типа и маршруты (data/functionTypes.ts). Второго
 * списка разделов нет: название, подпись и иконка — поле razdel у
 * подтемы, «Скоро» — её status.
 */

import { OPORNYE } from '@/content/opornye';
import { prepSkillsFor } from '@/content/prepSkills';
import type { ExamSection, Subtopic } from '@/content/sections';
import { subtopicBuilt } from '@/data/functionTypes';
import { findManifestFamily } from '@/lib/generator/manifest';
import { href, ZADANIYA } from '@/lib/paths';
import { prototypeSkills } from '../configurator/skillItems';
import { ikonkaRazdela } from './ikonka';
import { VKLADKA_PARAM, type RazdelyData } from './types';

export { ikonkaRazdela };

/**
 * Какие вкладки с материалом есть у подтемы. Те же условия, по которым
 * FunctionTopicPage решает, вести ли вкладку по адресу: опорные задачи
 * — когда есть навыки, тренажёр и генератор — когда есть наборы
 * прототипов. У закрытой подтемы нет ни того, ни другого.
 */
export function podtemaVkladki(subtopic: Subtopic): { prep: boolean; trainer: boolean } {
  const built = subtopicBuilt(subtopic);
  return {
    prep: built && prepSkillsFor(subtopic.id).length > 0,
    trainer: built && prototypeSkills(findManifestFamily(subtopic.id)).length > 0,
  };
}

/** Адреса вкладок подтемы: id вкладки ленты → адрес. */
function vkladkiPodtemy(section: ExamSection, subtopic: Subtopic): Record<string, string> {
  const base = href(ZADANIYA, section.slug, subtopic.id);
  const est = podtemaVkladki(subtopic);
  const naMeste = (id: string) => `${base}?${VKLADKA_PARAM}=${id}`;
  return {
    about: base,
    theory: naMeste('theory'),
    ...(subtopic.methods === true ? { methods: naMeste('methods') } : {}),
    ...(est.prep ? { prep: href(base, OPORNYE.tail) } : {}),
    ...(est.trainer ? { trainer: href(base, 'trenazher'), generator: naMeste('generator') } : {}),
  };
}

/** Данные навигации по разделам задания с подтемами. */
export function razdelyZadaniya(section: ExamSection, current: string): RazdelyData {
  return {
    no: section.no,
    current,
    podzagolovok: 'Перейдите к другим типам графиков функций',
    razdely: section.subtopics.map((subtopic) => ({
      id: subtopic.id,
      title: subtopic.title,
      graphName: subtopic.graphName,
      icon: ikonkaRazdela(section.slug, subtopic.icon),
      soon: !subtopicBuilt(subtopic),
      /* У закрытой подтемы страница есть (на ней «Скоро»), а вкладок
         с материалом нет. */
      vkladki: subtopicBuilt(subtopic)
        ? vkladkiPodtemy(section, subtopic)
        : { about: href(ZADANIYA, section.slug, subtopic.id) },
      scope: `${section.slug}:${subtopic.id}`,
    })),
  };
}
