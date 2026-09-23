'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { Badge, Button } from '@/components/ui';
import { Note, Option, OptionGroup, SkillCards, StepHead, type SkillItem } from '../configurator';
import { firstLevel, skillCounts, skillLevels, type SkillLevel } from '@/content/skills12';
import { trainerPage } from '@/content/trainerModes';
import { counted } from '@/lib/plural';

/** Режим тренировки в конфигураторе. */
export interface TrainerModeOption<M extends string = string> {
  id: M;
  title: string;
  lead: string;
  /**
   * Сколько заданий в режиме всего — число за словом «Все». Не задано —
   * столько, сколько задач у выбранного навыка.
   */
  total?: number;
  /** Режим сейчас недоступен: например, «Повтор ошибок» без ошибок. */
  locked?: boolean;
}

/** Что выбрано при заходе: ярлык прежнего адреса или ничего. */
export interface ConfiguratorPreset<M extends string = string> {
  /** Навык, выбранный при заходе. null — первый в списке. */
  skill: string | null;
  /**
   * Наборы, которыми ярлык ограничивает конфигуратор. Пусто или не
   * задано — все наборы семейства.
   */
  skills?: string[];
  mode: M;
}

/** Что собрал ученик: навык, режим, количество, сложность. */
export interface TrainerRequest<M extends string = string> {
  skill: SkillItem;
  mode: M;
  count: number;
  /** Уровень задач. null — у навыка уровней нет. */
  level: string | null;
}

/** Слова конфигуратора: по умолчанию — слова тренажёра задания №12. */
export type TrainerWords = typeof trainerPage;

export interface TrainerConfiguratorProps<M extends string> {
  /** Название семейства: в подзаголовке, бейдже и сводке. */
  family: string;
  skills: SkillItem[];
  modes: readonly TrainerModeOption<M>[];
  preset?: ConfiguratorPreset<M> | null;
  /** Уровни, из которых показываются те, что есть у навыка. */
  levels?: readonly SkillLevel[];
  /** Варианты количества; null — «Все». */
  counts?: readonly (number | null)[];
  words?: TrainerWords;
  /** «Начать тренировку»: сессию собирает тот, кто знает задачи. */
  onStart: (request: TrainerRequest<M>) => void;
  /** Сводка сделанного под конфигуратором. */
  stats?: ReactNode;
}

/**
 * Конфигуратор тренировки: навык, режим, количество, сложность.
 *
 * Один на все тренажёры сайта: задание №12 собирает по нему сессию
 * движка graph/, задания №4 и №5 — подход из банка задач. Сам
 * конфигуратор про задачи ничего не знает: выбор живёт в памяти
 * страницы, а «Начать тренировку» отдаёт его наружу.
 */
export function TrainerConfigurator<M extends string>({
  family,
  skills,
  modes,
  preset = null,
  levels = skillLevels,
  counts = skillCounts,
  words = trainerPage,
  onStart,
  stats,
}: TrainerConfiguratorProps<M>) {
  const first = skills.find((item) => item.id === preset?.skill) ?? skills[0];
  const [skillId, setSkillId] = useState(first?.id ?? '');
  const [mode, setMode] = useState<M>(preset?.mode ?? (modes[0]?.id as M));
  const [count, setCount] = useState<number | null>(10);
  const [level, setLevel] = useState<string | null>(firstLevel(first?.levels ?? []));

  const skill = skills.find((item) => item.id === skillId) ?? first;
  if (skill === undefined) {
    return null;
  }

  /* «Все» — сколько задач есть на самом деле: у одного навыка длина
     его набора, в режиме на всё семейство — все наборы. */
  const current = modes.find((item) => item.id === mode);
  const allCount = current?.total ?? skill.count;
  const shownLevels = levels.filter((item) => skill.levels.includes(item.id));
  const modeTitle = current?.title ?? '';
  const chosenCount = count ?? allCount;

  function pickSkill(id: string) {
    setSkillId(id);
    const next = skills.find((item) => item.id === id);
    /* У другого набора может не быть выбранного уровня. */
    if (next !== undefined && (level === null || !next.levels.includes(level))) {
      setLevel(firstLevel(next.levels));
    }
  }

  function start() {
    if (skill === undefined) {
      return;
    }
    onStart({ skill, mode, count: chosenCount, level });
  }

  return (
    <div className="cfg">
      <h3 className="t-h3 cfg__title">{words.builder}</h3>

      <div className="cfg__layout">
        <div className="cfg__steps">
          <section className="cfg-step" aria-labelledby="trainer-step-skill">
            <StepHead
              id="trainer-step-skill"
              no={words.skill.step}
              title={words.skill.title}
              lead={words.skill.lead.replace('{family}', family)}
            />
            <SkillCards
              items={skills}
              selected={[skill.id]}
              onToggle={pickSkill}
              labelledBy="trainer-step-skill"
            />
          </section>

          <section className="cfg-step" aria-labelledby="trainer-step-params">
            <StepHead
              id="trainer-step-params"
              no={words.params.step}
              title={words.params.title}
              lead={words.params.lead}
            />
            <div className="cfg-params">
              <OptionGroup id="trainer-param-mode" label={words.params.mode}>
                {modes.map((item) => {
                  const locked = item.locked === true;
                  return (
                    <Option
                      key={item.id}
                      checked={mode === item.id}
                      disabled={locked}
                      onSelect={() => setMode(item.id)}
                      title={item.title}
                      lead={locked ? words.params.noMistakes : item.lead}
                    />
                  );
                })}
              </OptionGroup>

              <OptionGroup id="trainer-param-count" label={words.params.count} compact>
                {counts.map((item) => (
                  <Option
                    key={item ?? 'all'}
                    checked={count === item}
                    onSelect={() => setCount(item)}
                    title={item === null ? `${words.params.all} (${allCount})` : item}
                  />
                ))}
              </OptionGroup>

              {shownLevels.length === 0 ? null : (
                <OptionGroup id="trainer-param-level" label={words.params.level}>
                  {shownLevels.map((item) => (
                    <Option
                      key={item.id}
                      checked={level === item.id}
                      onSelect={() => setLevel(item.id)}
                      title={item.title}
                      lead={item.lead}
                    />
                  ))}
                </OptionGroup>
              )}
            </div>
          </section>
        </div>

        <aside className="cfg-summary" aria-labelledby="trainer-summary-title">
          <h3 className="cfg-summary__title" id="trainer-summary-title">
            {words.summary.title}
          </h3>
          <Badge tone="info">{family}</Badge>
          <p className="cfg-summary__skill">{skill.title}</p>
          <p className="cfg-summary__count">
            {counted(skill.count, 'задание', 'задания', 'заданий')}
          </p>
          <div className="cfg-summary__chart" aria-hidden="true">
            {skill.chart}
          </div>
          <Note>{words.summary.note}</Note>
        </aside>
      </div>

      <div className="cfg-bar">
        <Button className="cfg-bar__start" size="lg" onClick={start}>
          {words.start}
        </Button>
        <p className="cfg-bar__summary">
          {family} · {skill.title} · {modeTitle} ·{' '}
          {counted(chosenCount, 'задание', 'задания', 'заданий')}
        </p>
      </div>

      {stats}
    </div>
  );
}
