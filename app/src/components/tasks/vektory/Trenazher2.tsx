'use client';

import { useState } from 'react';
import { Badge, Button } from '@/components/ui';
import { Note, Option, OptionGroup, SkillCards, StepHead, type SkillItem } from '../configurator';
import { trainerModes, trainerPage, type TrainerModeId } from '@/content/trainerModes';
import { O_ZADANII, TRENAZHER_2, VEKTORY } from '@/content/vektory';
import { counted } from '@/lib/plural';
import { progress2 } from '@/lib/vektory/progress';
import { buildSession2, kindTitle, type Task2 } from '@/lib/vektory/session';
import { scopeOfPath } from '@/lib/trainerSession/scope';
import { TrainerSessionHost, type ConfiguratorApi } from '../session';
import { Trenazher2Screen, razborOf } from './Trenazher2Screen';
import { Trenazher2Stats } from './Trenazher2Stats';
import { isTrenazher2Payload, type Trenazher2Payload } from './trenazher2Payload';
import { readTrenazher2Ui, type Trenazher2Ui } from './trenazher2Ui';

export interface Trenazher2Props {
  /** Адрес вкладки: туда ведёт кнопка возврата с итогового экрана. */
  base: string;
  /** Карточки прототипов: собраны на сервере. */
  skills: SkillItem[];
  /** Сколько заданий во всём банке раздела. */
  total: number;
}

const COUNTS: (number | null)[] = [5, 10, 20, null];

/**
 * Тренажёр задания №2: оболочка сессии вокруг конфигуратора и экрана.
 * Задания собираются в браузере и сохраняются целиком вместе с
 * закрытыми ответами: открытые числа в хранилище не попадают.
 */
export function Trenazher2({ base, skills, total }: Trenazher2Props) {
  return (
    <TrainerSessionHost<Trenazher2Payload, Trenazher2Ui>
      scope={scopeOfPath(base) ?? VEKTORY.slug}
      what="тренажёр"
      backHref={base}
      isPayload={isTrenazher2Payload}
      count={(payload) => payload.tasks.length}
      describe={(payload, at) => {
        const task = payload.tasks[at];
        if (task === undefined) {
          throw new Error('Нет задания');
        }
        return {
          kind: kindTitle(task.prototype),
          html: task.questionHtml,
          /* Разбор открывается только здесь, на итогах: он закрыт отпечатком. */
          review: () => <Trenazher2Review task={task} />,
        };
      }}
      subset={(payload, indexes) => ({
        ...payload,
        tasks: indexes.flatMap((at) => payload.tasks[at] ?? []),
      })}
      configurator={(api) => <Trenazher2Configurator skills={skills} total={total} api={api} />}
      screen={({ payload, sessionId, restored, report, elapsed, finish }) => (
        <Trenazher2Screen
          pool={payload.tasks}
          roundKey={sessionId}
          restored={restored === null ? null : readTrenazher2Ui(restored)}
          report={report}
          elapsed={elapsed}
          onFinish={finish}
          control={payload.control}
        />
      )}
    />
  );
}

/** Разбор задания на итогах: все шаги и рисунок с катетами. */
function Trenazher2Review({ task }: { task: Task2 }) {
  const razbor = razborOf(task);
  return (
    <div className="z2-razbor">
      {razbor.risunokSvg === null ? null : (
        <span className="vp-wrap" dangerouslySetInnerHTML={{ __html: razbor.risunokSvg }} />
      )}
      <ol className="z2-shagi">
        {razbor.shagi.map((shag, i) => (
          <li className="z2-shag" key={i}>
            <p className="z2-shag__title" dangerouslySetInnerHTML={{ __html: shag.zagolovokHtml }} />
            {shag.strokiHtml.map((line, j) => (
              <p className="z2-shag__line" key={j} dangerouslySetInnerHTML={{ __html: line }} />
            ))}
          </li>
        ))}
      </ol>
    </div>
  );
}

/**
 * Конфигуратор тренировки №2: прототип → режим → количество.
 *
 * Тот же порядок шагов, что у №8, без уровней: у прототипов векторов
 * их нет. Прототипы идут тремя группами — длина, скалярное
 * произведение, косинус. «Начать тренировку» собирает задачи в
 * браузере: генератор считает свежие числа, ответы сразу закрываются
 * отпечатком.
 */
function Trenazher2Configurator({
  skills,
  total,
  api,
}: {
  skills: SkillItem[];
  total: number;
  api: ConfiguratorApi<Trenazher2Payload>;
}) {
  const first = skills[0];
  const [skillId, setSkillId] = useState(first?.id ?? '');
  const [mode, setMode] = useState<TrainerModeId>('practice');
  const [count, setCount] = useState<number | null>(10);

  const progress = progress2.useProgress();
  const hasMistakes = progress.mistakes.length > 0;

  const skill = skills.find((item) => item.id === skillId) ?? first;
  if (skill === undefined) {
    return null;
  }

  const allCount =
    mode === 'mixed' ? total : mode === 'mistakes' ? progress.mistakes.length : skill.count;
  const modeTitle = trainerModes.find((item) => item.id === mode)?.title ?? '';
  const chosenCount = count ?? allCount;
  const skillTitle = mode === 'mixed' ? TRENAZHER_2.vse : skill.title;

  function start() {
    if (skill === undefined) {
      return;
    }
    const tasks = buildSession2({
      prototypes:
        mode === 'mixed' || mode === 'mistakes' ? skills.map((item) => item.id) : [skill.id],
      count: chosenCount,
      mode,
      mistakes: progress.mistakes,
    });
    if (tasks.length === 0) {
      return;
    }
    /* Оболочка сессии сохранит задания целиком и вернёт ученика в них. */
    api.start({ tasks, control: mode === 'control' });
  }

  return (
    <div className="cfg">
      <h3 className="t-h3 cfg__title">{trainerPage.builder}</h3>

      <div className="cfg__layout">
        <div className="cfg__steps">
          <section className="cfg-step" aria-labelledby="z2-step-skill">
            <StepHead
              id="z2-step-skill"
              no={trainerPage.skill.step}
              title={trainerPage.skill.title}
              lead={trainerPage.skill.lead.replace('{family}', VEKTORY.title)}
            />
            {O_ZADANII.gruppy.map((gruppa) => (
              <div className="z2-skills" key={gruppa.id}>
                <p className="z2-skills__group" id={`z2-step-skill-${gruppa.id}`}>
                  <span className="z2-group__code" aria-hidden="true">
                    {gruppa.id}
                  </span>
                  {gruppa.title}
                </p>
                <SkillCards
                  items={skills.filter((item) => item.id.startsWith(gruppa.id))}
                  selected={[skill.id]}
                  onToggle={setSkillId}
                  labelledBy={`z2-step-skill-${gruppa.id}`}
                />
              </div>
            ))}
          </section>

          <section className="cfg-step" aria-labelledby="z2-step-params">
            <StepHead
              id="z2-step-params"
              no={trainerPage.params.step}
              title={trainerPage.params.title}
              lead={trainerPage.params.lead}
            />
            <div className="cfg-params">
              <OptionGroup id="z2-param-mode" label={trainerPage.params.mode}>
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

              <OptionGroup id="z2-param-count" label={trainerPage.params.count} compact>
                {COUNTS.map((item) => (
                  <Option
                    key={item ?? 'all'}
                    checked={count === item}
                    onSelect={() => setCount(item)}
                    title={item === null ? `${trainerPage.params.all} (${allCount})` : item}
                  />
                ))}
              </OptionGroup>
            </div>
          </section>
        </div>

        <aside className="cfg-summary" aria-labelledby="z2-summary-title">
          <h3 className="cfg-summary__title" id="z2-summary-title">
            {trainerPage.summary.title}
          </h3>
          <Badge tone="info">{VEKTORY.title}</Badge>
          <p className="cfg-summary__skill">
            {mode === 'mixed' ? (
              TRENAZHER_2.vse
            ) : (
              <span dangerouslySetInnerHTML={{ __html: skill.titleHtml ?? skill.title }} />
            )}
          </p>
          <p className="cfg-summary__count">
            {counted(chosenCount, 'задание', 'задания', 'заданий')}
          </p>
          <div className="cfg-summary__chart z2-summary-chart" aria-hidden="true">
            {skill.chart}
          </div>
          <Note>{trainerPage.summary.note}</Note>
        </aside>
      </div>

      <div className="cfg-bar">
        <Button className="cfg-bar__start" size="lg" onClick={start}>
          {trainerPage.start}
        </Button>
        <p className="cfg-bar__summary no-math-check">
          {VEKTORY.title} · {mode === 'mixed' ? TRENAZHER_2.vse : skill.id} · {modeTitle} ·{' '}
          {counted(chosenCount, 'задание', 'задания', 'заданий')}
          <span className="sr-only"> {skillTitle}</span>
        </p>
      </div>

      <Trenazher2Stats total={total} />
    </div>
  );
}
