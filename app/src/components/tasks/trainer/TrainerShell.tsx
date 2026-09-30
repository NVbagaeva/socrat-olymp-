import type { ReactNode } from 'react';
import { trainerPage, trainerWordsFor } from '@/content/trainerModes';
import { skillLevelsFor } from '@/content/skills12';
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
  /* Ярлык может вести не в один набор, а в связку: тогда
     конфигуратор показывает только её наборы, и «Смешанная» идёт
     по ним же — иначе выбранное на экране расходилось бы с тем,
     что попадёт в тренировку. */
  const group = preset?.skills ?? [];
  const all = skillItems(family);
  const skills = group.length > 1 ? all.filter((item) => group.includes(item.id)) : all;
  const total = group.length > 1
    ? skills.reduce((sum, item) => sum + item.count, 0)
    : (family?.prototypes.tasks ?? 0);

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
          familyTotal={total}
          skills={skills}
          levels={skillLevelsFor(subtopic.id)}
          words={trainerWordsFor(subtopic.id)}
          /* Ответ выбором варианта — признак подтемы: у линейной его
             нет, и её тренажёр берёт только числовые ответы. */
          choice={subtopic.choiceAnswers === true}
          preset={preset}
        />
      )}
    </section>
  );
}
