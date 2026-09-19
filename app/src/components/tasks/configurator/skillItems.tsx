import { Chart } from '@/components/graph/Chart';
import { skillTitle } from '@/content/skills12';
import type { ManifestFamily } from '@/lib/generator/manifest';
import { generatorSkillScene } from '@/lib/scenes';
import type { SkillItem } from './SkillCards';

/**
 * Навыки семейства — наборы прототипов из манифеста. Подготовительные
 * наборы сюда не входят: там задачи с выбором варианта, и тренажёр
 * их не принимает.
 */
export function prototypeSkills(family: ManifestFamily | undefined) {
  return family === undefined ? [] : family.skills.filter((skill) => skill.kind === 'prototype');
}

/**
 * Карточки навыков, собранные на сервере: названия из конфига, числа
 * из манифеста, миниатюры рисует движок graph/ на сборке.
 */
export function skillItems(family: ManifestFamily | undefined): SkillItem[] {
  return prototypeSkills(family).map((skill) => ({
    id: skill.id,
    /* Набора без названия в конфиге нет, но если появится — на
       карточке будет его идентификатор, а не пустота. */
    title: skillTitle[skill.id] ?? skill.id,
    count: skill.count,
    levels: skill.levels,
    chart: <Chart className="cfg-chart" scene={generatorSkillScene(skill.id)} />,
  }));
}
