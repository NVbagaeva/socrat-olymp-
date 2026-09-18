import type { Subtopic } from '@/content/sections';
import { findManifestFamily } from '@/lib/generator/manifest';
import { skillItems } from '../configurator';
import { GeneratorScreen } from './GeneratorScreen';

export interface GeneratorTabProps {
  subtopic: Subtopic;
}

/**
 * Вкладка «Генератор», собранная на сервере: вариант для печати.
 *
 * Отсюда на клиентский экран уходят только названия, числа и готовые
 * миниатюры: движок graph/ рисует их на сборке, как на карточках
 * навыков подготовки, и в браузер не попадает.
 */
export function GeneratorTab({ subtopic }: GeneratorTabProps) {
  const family = findManifestFamily(subtopic.id);
  return <GeneratorScreen family={subtopic.title} skills={skillItems(family)} />;
}
