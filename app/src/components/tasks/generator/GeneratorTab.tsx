import type { Subtopic } from '@/content/sections';
import { findManifestFamily } from '@/lib/generator/manifest';
import { generatorPage } from '@/content/generator';
import { skillLevelsFor } from '@/content/skills12';
import { skillItems } from '../configurator';
import { GeneratorScreen } from './GeneratorScreen';

export interface GeneratorTabProps {
  subtopic: Subtopic;
  /** Адрес подтемы: от него считаются адреса страниц печати. */
  base: string;
}

/**
 * Вкладка «Генератор», собранная на сервере: вариант для печати.
 *
 * Отсюда на клиентский экран уходят только названия, числа и готовые
 * миниатюры: движок graph/ рисует их на сборке, как на карточках
 * навыков подготовки, и в браузер не попадает.
 */
export function GeneratorTab({ subtopic, base }: GeneratorTabProps) {
  const family = findManifestFamily(subtopic.id);
  /* Подписи уровней и плашка «откуда задания» — подтемы: у
     квадратичной наборы собственные, и обещать прототипы ФИПИ
     нельзя, а уровень у неё не про коэффициент b. */
  return (
    <GeneratorScreen
      base={base}
      family={subtopic.title}
      skills={skillItems(family)}
      levels={skillLevelsFor(subtopic.id)}
      note={subtopic.id === 'quadratic'
        ? generatorPage.summary.noteOwn
        : generatorPage.summary.note}
    />
  );
}
