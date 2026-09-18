import { Chart } from '@/components/graph/Chart';
import { generatorSkillTitle } from '@/content/generator';
import type { Subtopic } from '@/content/sections';
import { findManifestFamily, type ManifestFamily } from '@/lib/generator/manifest';
import { generatorSkillScene } from '@/lib/scenes';
import { GeneratorScreen, type GeneratorSkillItem } from './GeneratorScreen';

/**
 * Навыки генератора семейства — наборы прототипов из манифеста.
 * Подготовительные наборы сюда не входят: там задачи с выбором
 * варианта, и тренажёр их не принимает.
 */
export function generatorSkills(family: ManifestFamily | undefined) {
  return family === undefined ? [] : family.skills.filter((skill) => skill.kind === 'prototype');
}

export interface GeneratorTabProps {
  subtopic: Subtopic;
}

/**
 * Вкладка «Генератор», собранная на сервере.
 *
 * Отсюда на клиентский экран уходят только названия, числа и готовые
 * миниатюры: движок graph/ рисует их на сборке, как на карточках
 * навыков подготовки, и в браузер не попадает.
 */
export function GeneratorTab({ subtopic }: GeneratorTabProps) {
  const family = findManifestFamily(subtopic.id);
  const skills = generatorSkills(family);

  const items: GeneratorSkillItem[] = skills.map((skill) => ({
    id: skill.id,
    /* Название из конфига; набора без названия там нет, но если
       появится — на карточке будет его идентификатор, а не пустота. */
    title: generatorSkillTitle[skill.id] ?? skill.id,
    count: skill.count,
    levels: skill.levels,
    chart: <Chart className="gen-chart" scene={generatorSkillScene(skill.id)} />,
  }));

  return (
    <GeneratorScreen
      family={subtopic.title}
      familyTotal={family?.prototypes.tasks ?? 0}
      skills={items}
    />
  );
}
