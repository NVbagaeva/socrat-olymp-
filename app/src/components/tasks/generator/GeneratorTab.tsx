import type { Subtopic } from '@/content/sections';
import type { IkonkaRazdela } from '@/components/tasks/razdely/types';
import { findManifestFamily } from '@/lib/generator/manifest';
import { generatorPage } from '@/content/generator';
import { levelsWithHtml, skillLevelsFor } from '@/content/skills12';
import { typeset } from '@/lib/tex';
import { skillItems } from '../configurator/skillItems';
import { GeneratorScreen } from './GeneratorScreen';

export interface GeneratorTabProps {
  subtopic: Subtopic;
  /** Адрес подтемы: от него считаются адреса страниц печати. */
  base: string;
  /** Иконка раздела для сводки. */
  icon?: IkonkaRazdela | undefined;
}

/**
 * Вкладка «Генератор», собранная на сервере: вариант для печати.
 *
 * Отсюда на клиентский экран уходят только названия, числа и готовые
 * миниатюры: движок graph/ рисует их на сборке, как на карточках
 * навыков подготовки, и в браузер не попадает.
 */
export function GeneratorTab({ subtopic, base, icon }: GeneratorTabProps) {
  const family = findManifestFamily(subtopic.id);
  /* Подписи уровней и плашка «откуда задания» — подтемы: у
     квадратичной наборы собственные, и обещать прототипы ФИПИ
     нельзя, а уровень у неё не про коэффициент b. */
  return (
    <GeneratorScreen
      base={base}
      family={subtopic.title}
      familyIcon={icon}
      skills={skillItems(family)}
      levels={levelsWithHtml(skillLevelsFor(subtopic.id), typeset)}
      note={
        subtopic.id === 'quadratic' || subtopic.id === 'rational' || subtopic.id === 'irrational'
          ? generatorPage.summary.noteOwn
          : generatorPage.summary.note
      }
    />
  );
}
