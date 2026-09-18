import type { ReactNode } from 'react';
import { trainerPage } from '@/content/trainerModes';
import type { Subtopic } from '@/content/sections';
import { findManifestFamily } from '@/lib/generator/manifest';
import { skillItems } from '../configurator';
import { TabScrollOnMount } from '../TabScroll';
import { TrainerBuilder, type TrainerPreset } from './TrainerBuilder';

export interface TrainerShellProps {
  subtopic: Subtopic;
  /** Адрес вкладки тренажёра: туда возвращает итоговый экран. */
  base: string;
  /** Что выбрано при заходе по ярлыку прежнего адреса. */
  preset?: TrainerPreset | null;
  /** Экран сессии: подставляется вместо конфигуратора. */
  children?: ReactNode;
}

/**
 * Вкладка «Тренажёр»: заголовок и конфигуратор тренировки; сводка
 * сделанного живёт под конфигуратором и уходит вместе с ним, когда
 * начинается сессия. Шапку темы и ленту вкладок рисует страница
 * темы: вкладка живёт внутри них, а не вместо них.
 *
 * Карточки навыков собираются здесь, на сервере: движок рисует
 * миниатюры на сборке, в браузер уходит готовая разметка.
 */
export function TrainerShell({ subtopic, base, preset = null, children }: TrainerShellProps) {
  const family = findManifestFamily(subtopic.id);

  return (
    <section className="trainer">
      <header className="trainer__head">
        <h2 className="t-h2 trainer__title">{trainerPage.title}</h2>
      </header>

      {/* На телефоне вкладка оказывается ниже кромки экрана:
          подводим её к глазам, как во вкладке подготовки. */}
      <TabScrollOnMount />

      {children ?? (
        <TrainerBuilder
          base={base}
          family={subtopic.title}
          familyTotal={family?.prototypes.tasks ?? 0}
          skills={skillItems(family)}
          preset={preset}
        />
      )}
    </section>
  );
}
