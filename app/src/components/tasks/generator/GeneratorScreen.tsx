'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { clsx } from 'clsx';
import { AlertIcon, Badge, Button, CheckIcon } from '@/components/ui';
import {
  generatorCounts,
  generatorLaunches,
  generatorLevels,
  generatorModes,
  generatorPage,
  type GeneratorLaunchId,
  type GeneratorLevelId,
  type GeneratorModeId,
} from '@/content/generator';
import { counted } from '@/lib/plural';
import { useTrainerProgress } from '@/lib/trainerProgress';

export interface GeneratorSkillItem {
  /** Идентификатор набора движка: 12.A … */
  id: string;
  title: string;
  /** Сколько задач в наборе — из манифеста. */
  count: number;
  /** Уровни, встреченные у задач набора — из манифеста. */
  levels: string[];
  /** Миниатюра, собранная движком на сервере. */
  chart: ReactNode;
}

export interface GeneratorScreenProps {
  /** Название семейства: в подзаголовке, бейдже и сводке. */
  family: string;
  /** Сколько задач во всех наборах прототипов семейства. */
  familyTotal: number;
  skills: GeneratorSkillItem[];
}

/** Первый уровень из списка показа, который есть у набора. */
function firstLevel(levels: string[]): GeneratorLevelId | null {
  return generatorLevels.find((level) => levels.includes(level.id))?.id ?? null;
}

interface OptionProps {
  checked: boolean;
  disabled?: boolean;
  onSelect: () => void;
  title: ReactNode;
  lead?: ReactNode;
}

/** Кнопка-вариант в группе: радиокнопка по семантике, плашка по виду. */
function Option({ checked, disabled = false, onSelect, title, lead }: OptionProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      className={clsx('gen-opt', checked && 'is-checked')}
      disabled={disabled}
      onClick={onSelect}
    >
      <span className="gen-opt__title">{title}</span>
      {lead !== undefined ? <span className="gen-opt__lead">{lead}</span> : null}
    </button>
  );
}

/**
 * Экран вкладки «Генератор»: выбор навыка, параметры, сводка.
 *
 * Выбор живёт в памяти страницы. Кнопка «Начать тренировку» пока
 * выключена: сборка сессии — следующий этап, и кнопка, которая
 * ничего не делает, не должна выглядеть рабочей.
 */
export function GeneratorScreen({ family, familyTotal, skills }: GeneratorScreenProps) {
  const first = skills[0];
  const [skillId, setSkillId] = useState(first?.id ?? '');
  const [mode, setMode] = useState<GeneratorModeId>('practice');
  const [count, setCount] = useState<number | null>(10);
  const [level, setLevel] = useState<GeneratorLevelId | null>(firstLevel(first?.levels ?? []));
  const [launch, setLaunch] = useState<GeneratorLaunchId>('online');

  /* История ошибок читается, но не пишется: «Повтор ошибок» есть
     только тогда, когда ученику есть что повторять. */
  const progress = useTrainerProgress();
  const hasMistakes = progress.mistakes.length > 0;

  const skill = skills.find((item) => item.id === skillId) ?? first;
  if (skill === undefined) {
    return null;
  }

  /* «Все» — сколько задач есть на самом деле: у одного навыка длина
     его набора, в смешанной тренировке — все наборы семейства. */
  const allCount = mode === 'mixed' ? familyTotal : skill.count;
  const shownLevels = generatorLevels.filter((item) => skill.levels.includes(item.id));
  const modeTitle = generatorModes.find((item) => item.id === mode)?.title ?? '';
  const chosenCount = count ?? allCount;

  function pickSkill(id: string) {
    setSkillId(id);
    const next = skills.find((item) => item.id === id);
    /* У другого набора может не быть выбранного уровня. */
    if (next !== undefined && (level === null || !next.levels.includes(level))) {
      setLevel(firstLevel(next.levels));
    }
  }

  return (
    <section className="gen">
      <h2 className="t-h2 gen__title">{generatorPage.title}</h2>

      <div className="gen__layout">
        <div className="gen__steps">
          {/* Шаг 1: навык */}
          <section className="gen-step" aria-labelledby="gen-step-skill">
            <header className="gen-step__head">
              <span className="gen-step__no" aria-hidden="true">
                {generatorPage.skill.step}
              </span>
              <div className="gen-step__text">
                <h3 className="gen-step__title" id="gen-step-skill">
                  {generatorPage.skill.title}
                </h3>
                <p className="gen-step__lead">
                  {generatorPage.skill.lead.replace('{family}', family)}
                </p>
              </div>
            </header>

            <div className="gen-skills" role="radiogroup" aria-labelledby="gen-step-skill">
              {skills.map((item) => {
                const checked = item.id === skill.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="radio"
                    aria-checked={checked}
                    className={clsx('gen-skill', checked && 'is-checked')}
                    onClick={() => pickSkill(item.id)}
                  >
                    <span className="gen-skill__chart" aria-hidden="true">
                      {item.chart}
                    </span>
                    {checked ? (
                      <span className="gen-skill__check" aria-hidden="true">
                        <CheckIcon />
                      </span>
                    ) : null}
                    <span className="gen-skill__text">
                      <span className="gen-skill__title">{item.title}</span>
                      <span className="gen-skill__code">{item.id}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Шаг 2: параметры */}
          <section className="gen-step" aria-labelledby="gen-step-params">
            <header className="gen-step__head">
              <span className="gen-step__no" aria-hidden="true">
                {generatorPage.params.step}
              </span>
              <div className="gen-step__text">
                <h3 className="gen-step__title" id="gen-step-params">
                  {generatorPage.params.title}
                </h3>
                <p className="gen-step__lead">{generatorPage.params.lead}</p>
              </div>
            </header>

            <div className="gen-params">
              <div className="gen-param" role="radiogroup" aria-labelledby="gen-param-mode">
                <span className="gen-param__label" id="gen-param-mode">
                  {generatorPage.params.mode}
                </span>
                <div className="gen-param__options">
                  {generatorModes.map((item) => {
                    const locked = item.id === 'mistakes' && !hasMistakes;
                    return (
                      <Option
                        key={item.id}
                        checked={mode === item.id}
                        disabled={locked}
                        onSelect={() => setMode(item.id)}
                        title={item.title}
                        lead={locked ? generatorPage.params.noMistakes : item.lead}
                      />
                    );
                  })}
                </div>
              </div>

              <div className="gen-param" role="radiogroup" aria-labelledby="gen-param-count">
                <span className="gen-param__label" id="gen-param-count">
                  {generatorPage.params.count}
                </span>
                <div className="gen-param__options gen-param__options--compact">
                  {generatorCounts.map((item) => (
                    <Option
                      key={item ?? 'all'}
                      checked={count === item}
                      onSelect={() => setCount(item)}
                      title={item === null ? `${generatorPage.params.all} (${allCount})` : item}
                    />
                  ))}
                </div>
              </div>

              {shownLevels.length === 0 ? null : (
                <div className="gen-param" role="radiogroup" aria-labelledby="gen-param-level">
                  <span className="gen-param__label" id="gen-param-level">
                    {generatorPage.params.level}
                  </span>
                  <div className="gen-param__options">
                    {shownLevels.map((item) => (
                      <Option
                        key={item.id}
                        checked={level === item.id}
                        onSelect={() => setLevel(item.id)}
                        title={item.title}
                        lead={item.lead}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Сводка справа */}
        <aside className="gen-summary" aria-labelledby="gen-summary-title">
          <h3 className="gen-summary__title" id="gen-summary-title">
            {generatorPage.summary.title}
          </h3>
          <Badge tone="info">{family}</Badge>
          <p className="gen-summary__skill">{skill.title}</p>
          <p className="gen-summary__count">
            {counted(skill.count, 'задание', 'задания', 'заданий')}
          </p>
          <div className="gen-summary__chart" aria-hidden="true">
            {skill.chart}
          </div>
          <p className="gen-note">
            <span className="gen-note__ico" aria-hidden="true">
              <AlertIcon />
            </span>
            {generatorPage.summary.note}
          </p>
        </aside>
      </div>

      {/* Нижняя панель */}
      <div className="gen-bar">
        <div className="gen-bar__launch" role="radiogroup" aria-label={generatorPage.launch.label}>
          {generatorLaunches.map((item) => {
            const soon = item.id === 'pdf';
            return (
              <Option
                key={item.id}
                checked={launch === item.id}
                disabled={soon}
                onSelect={() => setLaunch(item.id)}
                title={item.title}
                lead={soon ? generatorPage.launch.pdfSoon : undefined}
              />
            );
          })}
        </div>
        {/* Кнопка выключена, пока сборка сессии не сделана. */}
        <Button className="gen-bar__start" size="lg" disabled>
          {generatorPage.launch.start}
        </Button>
        <p className="gen-bar__summary">
          {family} · {skill.title} · {modeTitle} ·{' '}
          {counted(chosenCount, 'задание', 'задания', 'заданий')}
        </p>
      </div>
    </section>
  );
}
