'use client';

import { useState } from 'react';
import { Badge, Button } from '@/components/ui';
import { Note, Option, OptionGroup, SkillCards, StepHead, type SkillItem } from '../configurator';
import { firstLevel, skillCounts, skillLevels, type SkillLevelId } from '@/content/skills12';
import { trainerModes, trainerPage, type TrainerModeId } from '@/content/trainerModes';
import { counted } from '@/lib/plural';
import { useTrainerProgress } from '@/lib/trainerProgress';
import { buildSession, type Session } from '@/lib/trainerSession';
import { TrainerScreen } from './TrainerScreen';
import { TrainerStats } from './TrainerStats';

export interface TrainerPreset {
  /** Набор движка, выбранный при заходе. null — первый в списке. */
  skill: string | null;
  mode: TrainerModeId;
}

export interface TrainerBuilderProps {
  /** Адрес вкладки: туда ведёт кнопка возврата с итогового экрана. */
  base: string;
  /** Название семейства: в подзаголовке, бейдже и сводке. */
  family: string;
  /** Сколько задач во всех наборах прототипов семейства. */
  familyTotal: number;
  skills: SkillItem[];
  /** Что выбрано при заходе: ярлык прежнего адреса или ничего. */
  preset?: TrainerPreset | null;
}

/** Собранная сессия: задания и ключ подхода. */
interface Started {
  key: string;
  session: Session;
  control: boolean;
}

/**
 * Конфигуратор тренировки: навык, режим, количество, сложность.
 *
 * Выбор живёт в памяти страницы. «Начать тренировку» собирает сессию
 * тут же, в браузере, — движок считает свежие числа и ответы, и
 * экран задания встаёт на место конфигуратора. Ни задания, ни
 * ответы в разметку страницы не попадают.
 */
export function TrainerBuilder({ base, family, familyTotal, skills, preset = null }: TrainerBuilderProps) {
  const first = skills.find((item) => item.id === preset?.skill) ?? skills[0];
  const [skillId, setSkillId] = useState(first?.id ?? '');
  const [mode, setMode] = useState<TrainerModeId>(preset?.mode ?? 'practice');
  const [count, setCount] = useState<number | null>(10);
  const [level, setLevel] = useState<SkillLevelId | null>(firstLevel(first?.levels ?? []));
  const [started, setStarted] = useState<Started | null>(null);

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
  const shownLevels = skillLevels.filter((item) => skill.levels.includes(item.id));
  const modeTitle = trainerModes.find((item) => item.id === mode)?.title ?? '';
  const chosenCount = count ?? allCount;

  function start() {
    if (skill === undefined) {
      return;
    }
    const session = buildSession({
      skills: mode === 'mixed' || mode === 'mistakes' ? skills.map((item) => item.id) : [skill.id],
      level: mode === 'mistakes' ? null : level,
      count: chosenCount,
      mode,
      mistakes: progress.mistakes,
    });
    if (session.tasks.length === 0) {
      return;
    }
    /* Ключ подхода новый на каждый запуск: подход не переиспользует
       прошлую раскладку. */
    setStarted({ key: `session:${Date.now()}`, session, control: mode === 'control' });
  }

  if (started !== null) {
    return (
      <TrainerScreen
        pool={started.session.tasks}
        roundKey={started.key}
        backHref={base}
        control={started.control}
      />
    );
  }

  function pickSkill(id: string) {
    setSkillId(id);
    const next = skills.find((item) => item.id === id);
    /* У другого набора может не быть выбранного уровня. */
    if (next !== undefined && (level === null || !next.levels.includes(level))) {
      setLevel(firstLevel(next.levels));
    }
  }

  return (
    <div className="cfg">
      <h3 className="t-h3 cfg__title">{trainerPage.builder}</h3>

      <div className="cfg__layout">
        <div className="cfg__steps">
          <section className="cfg-step" aria-labelledby="trainer-step-skill">
            <StepHead
              id="trainer-step-skill"
              no={trainerPage.skill.step}
              title={trainerPage.skill.title}
              lead={trainerPage.skill.lead.replace('{family}', family)}
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
              no={trainerPage.params.step}
              title={trainerPage.params.title}
              lead={trainerPage.params.lead}
            />
            <div className="cfg-params">
              <OptionGroup id="trainer-param-mode" label={trainerPage.params.mode}>
                {trainerModes.map((item) => {
                  const locked = item.id === 'mistakes' && !hasMistakes;
                  return (
                    <Option
                      key={item.id}
                      checked={mode === item.id}
                      disabled={locked}
                      onSelect={() => setMode(item.id)}
                      title={item.title}
                      lead={locked ? trainerPage.params.noMistakes : item.lead}
                    />
                  );
                })}
              </OptionGroup>

              <OptionGroup id="trainer-param-count" label={trainerPage.params.count} compact>
                {skillCounts.map((item) => (
                  <Option
                    key={item ?? 'all'}
                    checked={count === item}
                    onSelect={() => setCount(item)}
                    title={item === null ? `${trainerPage.params.all} (${allCount})` : item}
                  />
                ))}
              </OptionGroup>

              {shownLevels.length === 0 ? null : (
                <OptionGroup id="trainer-param-level" label={trainerPage.params.level}>
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
            {trainerPage.summary.title}
          </h3>
          <Badge tone="info">{family}</Badge>
          <p className="cfg-summary__skill">{skill.title}</p>
          <p className="cfg-summary__count">
            {counted(skill.count, 'задание', 'задания', 'заданий')}
          </p>
          <div className="cfg-summary__chart" aria-hidden="true">
            {skill.chart}
          </div>
          <Note>{trainerPage.summary.note}</Note>
        </aside>
      </div>

      <div className="cfg-bar">
        <Button className="cfg-bar__start" size="lg" onClick={start}>
          {trainerPage.start}
        </Button>
        <p className="cfg-bar__summary">
          {family} · {skill.title} · {modeTitle} ·{' '}
          {counted(chosenCount, 'задание', 'задания', 'заданий')}
        </p>
      </div>

      {/* Что уже сделано: знаменатель — все задания прототипов семейства. */}
      <TrainerStats total={familyTotal} />
    </div>
  );
}
