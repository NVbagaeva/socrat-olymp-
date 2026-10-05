'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { Badge, Button } from '@/components/ui';
import {
  CountPicker,
  Note,
  Option,
  OptionGroup,
  SkillCards,
  StepHead,
  countLabel,
  countOf,
  useCountChoice,
  type SkillItem,
} from '../configurator';
import { firstLevel, skillCounts, skillLevels, type SkillLevel } from '@/content/skills12';
import { trainerPage } from '@/content/trainerModes';
import { counted } from '@/lib/plural';
import { TitleText } from '../TitleText';

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

/** Что собрал ученик: навыки, режим, количество, сложность. */
export interface TrainerRequest<M extends string = string> {
  /** Первый из выбранных навыков. */
  skill: SkillItem;
  /**
   * Все выбранные навыки — один или несколько. Режимы «на всё
   * семейство» (смешанная, повтор ошибок) выбор не учитывают.
   */
  skills: SkillItem[];
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

function allChosen(chosen: SkillItem[]): number {
  return chosen.reduce((sum, item) => sum + item.count, 0);
}

/** Названия выбранных навыков в строку сводки: два — через «и», больше — числом. */
function chosenTitle(chosen: SkillItem[], unit: [string, string, string]): ReactNode {
  const [one, two] = chosen;
  if (one === undefined) {
    return null;
  }
  if (chosen.length === 1) {
    return <TitleText title={one.title} html={one.titleHtml} />;
  }
  if (chosen.length === 2 && two !== undefined) {
    return (
      <>
        <TitleText title={one.title} html={one.titleHtml} /> и{' '}
        <TitleText title={two.title} html={two.titleHtml} />
      </>
    );
  }
  return counted(chosen.length, ...unit);
}

/**
 * Конфигуратор тренировки: навыки, режим, количество, сложность.
 *
 * Навыков можно выбрать несколько: «Отработка» и «Контроль» идут по
 * выбранным, «Смешанная» и «Повтор ошибок» — по всему семейству.
 * Последний выбранный навык снять нельзя: пустую тренировку не
 * собрать.
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
  const [selected, setSelected] = useState<string[]>(first === undefined ? [] : [first.id]);
  const [mode, setMode] = useState<M>(preset?.mode ?? (modes[0]?.id as M));
  const [count, setCount] = useCountChoice();
  const [level, setLevel] = useState<string | null>(firstLevel(first?.levels ?? []));

  const picked = skills.filter((item) => selected.includes(item.id));
  const skill = picked[0] ?? first;
  if (skill === undefined) {
    return null;
  }
  const chosen = picked.length === 0 ? [skill] : picked;

  /* «Все» — сколько задач есть на самом деле: у выбранных навыков
     сумма их наборов, в режиме на всё семейство — все наборы. */
  const current = modes.find((item) => item.id === mode);
  const allCount = current?.total ?? chosen.reduce((sum, item) => sum + item.count, 0);
  const chosenLevels = chosen.flatMap((item) => item.levels);
  const shownLevels = levels.filter((item) => chosenLevels.includes(item.id));
  const modeTitle = current?.title ?? '';
  /* null — в поле «Своё» пусто: запускать нечего. */
  const chosenCount = countOf(count, allCount);

  function toggleSkill(id: string) {
    const next = selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id];
    if (next.length === 0) {
      return;
    }
    setSelected(next);
    /* У выбранных наборов может не быть выбранного уровня. */
    const nextLevels = skills.filter((item) => next.includes(item.id)).flatMap((item) => item.levels);
    if (level === null || !nextLevels.includes(level)) {
      setLevel(firstLevel(nextLevels));
    }
  }

  function start() {
    if (skill === undefined || chosenCount === null) {
      return;
    }
    onStart({ skill, skills: chosen, mode, count: chosenCount, level });
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
              selected={chosen.map((item) => item.id)}
              onToggle={toggleSkill}
              multiple
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

              <CountPicker
                id="trainer-param-count"
                label={words.params.count}
                max={allCount}
                value={count}
                onChange={setCount}
                presets={counts}
                allWord={words.params.all}
              />

              {shownLevels.length === 0 ? null : (
                <OptionGroup id="trainer-param-level" label={words.params.level}>
                  {shownLevels.map((item) => (
                    <Option
                      key={item.id}
                      checked={level === item.id}
                      onSelect={() => setLevel(item.id)}
                      title={item.title}
                      lead={<TitleText title={item.lead} html={item.leadHtml} />}
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
          {chosen.length === 1 ? (
            <>
              <p className="cfg-summary__skill">
                <TitleText title={skill.title} html={skill.titleHtml} />
              </p>
              <p className="cfg-summary__count">
                {counted(skill.count, 'задание', 'задания', 'заданий')}
              </p>
              <div className="cfg-summary__chart" aria-hidden="true">
                {skill.chart}
              </div>
            </>
          ) : (
            <>
              <ul className="cfg-summary__skills">
                {chosen.map((item) => (
                  <li key={item.id} className="cfg-summary__skill">
                    <TitleText title={item.title} html={item.titleHtml} />
                  </li>
                ))}
              </ul>
              <p className="cfg-summary__count">
                {counted(allChosen(chosen), 'задание', 'задания', 'заданий')}
              </p>
            </>
          )}
          <Note>{words.summary.note}</Note>
        </aside>
      </div>

      <div className="cfg-bar">
        <Button
          className="cfg-bar__start"
          size="lg"
          onClick={start}
          disabled={chosenCount === null}
        >
          {words.start}
        </Button>
        <p className="cfg-bar__summary">
          {family} · {chosenTitle(chosen, words.skill.unit)} · {modeTitle} ·{' '}
          {countLabel(chosenCount)}
        </p>
      </div>

      {stats}
    </div>
  );
}
