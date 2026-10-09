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
import { assetUrl } from '@/lib/assetUrl';
import { findManifestFamily } from '@/lib/generator/manifest';
import { href, ZADANIYA } from '@/lib/paths';
import { typeset } from '@/lib/tex';
import { prototypeSkills } from '../configurator/skillItems';
import { VKLADKA_PARAM, type IkonkaRazdela, type RazdelyData } from './types';

/** Ширины файлов иконок — как в scripts/build-razdely-icons.mjs. */
const WIDTHS = [96, 192, 384] as const;
/** Пропорции иконок: исходник 1024×923. */
const ICON_W = 1024;
const ICON_H = 923;

/** Иконка раздела: файлы public/images/razdely/<задание>/<имя>-<ширина>.*. */
export function ikonkaRazdela(task: string, name: string): IkonkaRazdela {
  const file = (width: number, ext: string) =>
    assetUrl(`/images/razdely/${task}/${name}-${width}.${ext}`);
  const set = (ext: string) => WIDTHS.map((width) => `${file(width, ext)} ${width}w`).join(', ');
  return {
    webp: set('webp'),
    png: set('png'),
    src: file(192, 'png'),
    width: ICON_W,
    height: ICON_H,
  };
}

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
      title: subtopic.razdel.title,
      captionHtml: typeset(subtopic.razdel.caption),
      icon: ikonkaRazdela(section.slug, subtopic.razdel.icon),
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
