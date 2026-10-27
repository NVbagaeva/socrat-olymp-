import type { ReactNode } from 'react';
import { trainerPage } from '@/content/trainerModes';
import type { TrainerModeId } from '@/content/trainerModes';
import type { Subtopic } from '@/content/sections';
import type { IkonkaRazdela } from '@/components/tasks/razdely/types';
import { ZADANIYA } from '@/lib/paths';
import { izmenit, kRazdelu, NACHALNYY } from '@/lib/trenazher/filtr';
import type { Filtr, TrenazherConfig } from '@/lib/trenazher/types';
import { podtemaNabora, trenazherConfig12, zadachi12 } from '@/lib/ves12/trenazher12';
import { TabScrollOnMount } from '../TabScroll';
import { Trenazher12Lazy } from './Trenazher12Lazy';
import { szhatRefs } from './refsSzhato';

/** Ярлык прежнего адреса /trenazher/<режим>/: наборы, режим, правила ответа. */
export interface TrainerPreset {
  skill: string | null;
  skills?: string[];
  mode: TrainerModeId;
  rules?: string[];
  filter?: string;
}

export interface TrainerShellProps {
  subtopic: Subtopic;
  /** Адрес вкладки тренажёра: туда возвращает итоговый экран. */
  base: string;
  /** Что выбрано при заходе по ярлыку прежнего адреса. */
  preset?: TrainerPreset | null;
  /** Иконка раздела для сводки. */
  icon?: IkonkaRazdela | undefined;
  /** Экран сессии: подставляется вместо тренажёра. */
  children?: ReactNode;
}

/**
 * Ярлык прежнего адреса — в фильтр: «Отработка» — выбранные наборы от
 * простых к сложным, «Смешанная» — вперемешку, «Повтор ошибок» —
 * только с ошибками, «Контроль» — без подсказок.
 */
export function filtrYarlyka(preset: TrainerPreset, config: TrenazherConfig): Filtr {
  const skills = preset.skills ?? (preset.skill === null ? [] : [preset.skill]);
  let f: Filtr = { ...NACHALNYY };
  if (skills.length > 0) f = izmenit(f, { tipy: skills });
  if (preset.rules !== undefined && preset.rules.length > 0) {
    f = izmenit(f, {
      pravila: preset.rules,
      ...(preset.filter === undefined ? {} : { pravilaTitle: preset.filter }),
    });
  }
  if (preset.mode === 'practice') f = izmenit(f, { poryadok: 'prostye' });
  if (preset.mode === 'mistakes') f = izmenit(f, { moi: 'oshibki' });
  if (preset.mode === 'control') f = izmenit(f, { rezhim: 'bez' });
  return kRazdelu(f, config);
}

/** Теория и опорные задачи подтемы — ссылки в итогах по типам с ошибками. */
export function ssylki12(): Record<string, { teoriya: string; opornye: string }> {
  return Object.fromEntries(
    Object.entries(podtemaNabora()).map(([set, tip]) => [
      set,
      { teoriya: `${ZADANIYA}/12/${tip}/`, opornye: `${ZADANIYA}/12/${tip}/opornye-zadachi/` },
    ]),
  );
}

/**
 * Вкладка «Тренажёр» подтемы №12: панель фильтров сверху и сессия.
 * Конфиг и список шаблонов задач собираются здесь, на сервере: данные
 * прототипов в браузер не идут, движок грузится по «Начать».
 */
export function TrainerShell({ subtopic, base, icon, preset = null, children }: TrainerShellProps) {
  const config = trenazherConfig12(subtopic.id);
  const refs = zadachi12(subtopic.id);
  const sets = config.temy.flatMap((t) => t.podtipy.map((p) => p.id));
  return (
    <section className="trainer">
      <header className="trainer__head">
        <h2 className="t-h2 trainer__title">{trainerPage.title}</h2>
      </header>
      <TabScrollOnMount />
      {children ?? (
        <Trenazher12Lazy
          config={config}
          refs={szhatRefs(refs)}
          start={preset === null ? null : filtrYarlyka(preset, config)}
          backHref={base}
          ssylki={ssylki12()}
          svodka={{ total: refs.length, sets, razdel: { title: subtopic.title, icon } }}
        />
      )}
    </section>
  );
}
