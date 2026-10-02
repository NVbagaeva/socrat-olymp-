'use client';

import { useState } from 'react';
import { Badge, Button } from '@/components/ui';
import { Note, Option, OptionGroup, SkillCards, StepHead, type SkillItem } from '../configurator';
import { trainerModes, trainerPage, type TrainerModeId } from '@/content/trainerModes';
import { VYCHISLENIYA } from '@/content/vychisleniya';
import { counted } from '@/lib/plural';
import { progress8 } from '@/lib/vychisleniya/progress';
import { buildSession8, type Task8 } from '@/lib/vychisleniya/session';
import { LEVELS } from '@/lib/vychisleniya/skills';
import type { Level } from '@/lib/vychisleniya/types';
import { Trenazher8Screen } from './Trenazher8Screen';
import { Trenazher8Stats } from './Trenazher8Stats';

export interface Trenazher8Props {
  /** Адрес вкладки: туда ведёт кнопка возврата с итогового экрана. */
  base: string;
  /** Карточки навыков: собраны на сервере, формулы набраны KaTeX. */
  skills: SkillItem[];
  /** Сколько заданий во всём банке раздела. */
  total: number;
}

interface Started {
  key: string;
  tasks: Task8[];
  control: boolean;
}

const COUNTS: (number | null)[] = [5, 10, 20, null];

/**
 * Конфигуратор тренировки №8: навык → режим → количество → уровень.
 *
 * Тот же порядок шагов, что у №12, свой компонент. «Начать
 * тренировку» собирает задачи в браузере: генератор считает свежие
 * числа, ответы сразу закрываются отпечатком.
 */
export function Trenazher8({ base, skills, total }: Trenazher8Props) {
  const first = skills[0];
  const [skillId, setSkillId] = useState(first?.id ?? '');
  const [mode, setMode] = useState<TrainerModeId>('practice');
  const [count, setCount] = useState<number | null>(10);
  const [level, setLevel] = useState<Level>('base');
  const [started, setStarted] = useState<Started | null>(null);

  /* История ошибок только читается: «Повтор ошибок» доступен, когда
     есть что повторять. */
  const progress = progress8.useProgress();
  const hasMistakes = progress.mistakes.length > 0;

  const skill = skills.find((item) => item.id === skillId) ?? first;
  if (skill === undefined) {
    return null;
  }

  const allCount = mode === 'mixed' ? total : mode === 'mistakes' ? progress.mistakes.length : skill.count;
  const modeTitle = trainerModes.find((item) => item.id === mode)?.title ?? '';
  const chosenCount = count ?? allCount;

  function start() {
    if (skill === undefined) {
      return;
    }
    const tasks = buildSession8({
      skills: mode === 'mixed' || mode === 'mistakes' ? skills.map((item) => item.id) : [skill.id],
      level: mode === 'mistakes' ? null : level,
      count: chosenCount,
      mode,
      mistakes: progress.mistakes,
    });
    if (tasks.length === 0) {
      return;
    }
    setStarted({ key: `session8:${Date.now()}`, tasks, control: mode === 'control' });
  }

  if (started !== null) {
    return <Trenazher8Screen pool={started.tasks} roundKey={started.key} backHref={base} control={started.control} />;
  }

  return (
    <div className="cfg">
      <h3 className="t-h3 cfg__title">{trainerPage.builder}</h3>

      <div className="cfg__layout">
        <div className="cfg__steps">
          <section className="cfg-step" aria-labelledby="z8-step-skill">
            <StepHead
              id="z8-step-skill"
              no={trainerPage.skill.step}
              title={trainerPage.skill.title}
              lead={trainerPage.skill.lead.replace('{family}', VYCHISLENIYA.title)}
            />
            {/* Обёртка со своим классом: на узком экране карточка с формулой
                раскладывается иначе, чем карточка с чертежом у №12. */}
            <div className="z8-skills">
              <SkillCards items={skills} selected={[skill.id]} onToggle={setSkillId} labelledBy="z8-step-skill" />
            </div>
          </section>

          <section className="cfg-step" aria-labelledby="z8-step-params">
            <StepHead id="z8-step-params" no={trainerPage.params.step} title={trainerPage.params.title} lead={trainerPage.params.lead} />
            <div className="cfg-params">
              <OptionGroup id="z8-param-mode" label={trainerPage.params.mode}>
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

              <OptionGroup id="z8-param-count" label={trainerPage.params.count} compact>
                {COUNTS.map((item) => (
                  <Option
                    key={item ?? 'all'}
                    checked={count === item}
                    onSelect={() => setCount(item)}
                    title={item === null ? `${trainerPage.params.all} (${allCount})` : item}
                  />
                ))}
              </OptionGroup>

              {mode === 'mistakes' ? null : (
                <OptionGroup id="z8-param-level" label={trainerPage.params.level}>
                  {LEVELS.map((item) => (
                    <Option key={item.id} checked={level === item.id} onSelect={() => setLevel(item.id)} title={item.nazvanie} lead={item.lead} />
                  ))}
                </OptionGroup>
              )}
            </div>
          </section>
        </div>

        <aside className="cfg-summary" aria-labelledby="z8-summary-title">
          <h3 className="cfg-summary__title" id="z8-summary-title">
            {trainerPage.summary.title}
          </h3>
          <Badge tone="info">{VYCHISLENIYA.title}</Badge>
          <p className="cfg-summary__skill">{mode === 'mixed' ? 'Все навыки' : skill.title}</p>
          <p className="cfg-summary__count">{counted(chosenCount, 'задание', 'задания', 'заданий')}</p>
          <div className="cfg-summary__chart z8-formula z8-formula--big" aria-hidden="true">
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
          {VYCHISLENIYA.title} · {mode === 'mixed' ? 'Все навыки' : skill.title} · {modeTitle} · {counted(chosenCount, 'задание', 'задания', 'заданий')}
        </p>
      </div>

      <Trenazher8Stats total={total} />
    </div>
  );
}
