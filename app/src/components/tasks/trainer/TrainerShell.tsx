import type { ReactNode } from 'react';
import { trainerPage, trainerWordsFor } from '@/content/trainerModes';
import { levelsWithHtml, skillLevelsFor } from '@/content/skills12';
import { typeset } from '@/lib/tex';
import type { Subtopic } from '@/content/sections';
import { findManifestFamily } from '@/lib/generator/manifest';
import { prototypes } from '@/lib/graph/data/index.js';
import { skillItems } from '../configurator/skillItems';
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
  const rules = preset?.rules ?? [];
  const all = skillItems(family);
  /* Фильтр по правилу ответа: в конфигураторе только наборы ярлыка,
     и у каждого — столько задач, сколько оставил фильтр. */
  const skills = rules.length > 0
    ? all
      .filter((item) => group.includes(item.id))
      .map((item) => ({ ...item, count: ruleCount(item.id, rules) }))
    : group.length > 1 ? all.filter((item) => group.includes(item.id)) : all;
  const total = group.length > 1 || rules.length > 0
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

      {children === undefined && preset?.filter !== undefined ? (
        <p className="trainer__filter">
          <span className="trainer__filter-text">{preset.filter}</span>
          <a className="trainer__filter-reset" href={base}>
            Показать все задачи
          </a>
        </p>
      ) : null}

      {children ?? (
        <TrainerBuilder
          base={base}
          family={subtopic.title}
          familyTotal={total}
          skills={skills}
          levels={levelsWithHtml(skillLevelsFor(subtopic.id), typeset)}
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

/** Сколько задач набора отвечают по одному из правил. */
function ruleCount(setId: string, rules: string[]): number {
  const set = (prototypes as unknown as { id: string; tasks: { answerRule?: string }[] }[]).find(
    (item) => item.id === setId,
  );
  return set === undefined
    ? 0
    : set.tasks.filter((task) => rules.includes(task.answerRule ?? '')).length;
}
