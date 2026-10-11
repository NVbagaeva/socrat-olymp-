'use client';

import { useEffect, useRef, useState } from 'react';
import { Badge, Button } from '@/components/ui';
import { Note, Option, OptionGroup, SkillCards, StepHead, type SkillItem } from '../configurator';
import { trainerModes, trainerPage, type TrainerModeId } from '@/content/trainerModes';
import { PROIZVODNAYA } from '@/content/proizvodnaya';
import { counted } from '@/lib/plural';
import { progress9 } from '@/lib/proizvodnaya/progress';
import { allGroupIds, buildSession9, isOpenId, kindTitle } from '@/lib/proizvodnaya/session';
import { ISTOCHNIK_OTKRYTYJ, ISTOCHNIK_SVOI, useIstochnik } from '@/lib/proizvodnaya/istochnik';
import { scopeOfPath } from '@/lib/trainerSession/scope';
import { TrainerSessionHost, type ConfiguratorApi, type SummaryData } from '../session';
import { Risunok9 } from './Risunok9';
import { Razbor9, Trenazher9Screen, razborOf } from './Trenazher9Screen';
import { Trenazher9Stats } from './Trenazher9Stats';
import {
  isTrenazher9Payload,
  packTrenazher9,
  similarTrenazher9,
  unpackTrenazher9,
  type Trenazher9Payload,
} from './trenazher9Payload';
import { readTrenazher9Ui, type Trenazher9Ui } from './trenazher9Ui';

export interface Trenazher9Props {
  /** Адрес раздела: по нему оболочка сессии и лента вкладок находят тренировку. */
  base: string;
  /** Куда ведёт «Вернуться к заданиям» с итогового экрана. */
  backHref: string;
  /** Карточки групп: собраны на сервере, рисунки и формулы готовы. */
  groups: SkillItem[];
  /** Сколько типов задач (прототипов) в каждой группе. */
  prototypesOf: Record<string, number>;
  /** Сколько задач открытого банка в каждой группе. */
  openOf: Record<string, number>;
}

const COUNTS: (number | null)[] = [5, 10, 20, null];

/* «Все» не должно собирать сотню задач сразу: генератор считает рисунки
   в браузере, и сессия на сорок заданий уже достаточно длинная. */
const MAX_ALL = 40;

/**
 * То, что прежний итог №9 показывал сверх общих строк: сколько заданий
 * закрыто (решено, с подсказкой или с решением) и какая доля из них
 * решена верно, и пометка о досрочном завершении.
 */
function Itog9({ data }: { data: SummaryData }) {
  const total = data.items.length;
  const right = data.items.filter((item) => item.mark === 'right').length;
  const solved = right + data.items.filter((item) => item.mark === 'hinted').length;
  const percent = solved === 0 ? 0 : Math.round((right / solved) * 100);
  /* Строкой, а не ещё одним списком tdone__rows: строки итогов общие,
     и по ним их читают проверки. */
  return (
    <p className="tdone__lead">
      {solved < total ? 'Тренировка завершена досрочно. ' : ''}
      Решено (закрыто): {solved} из {total}; верно среди решённых — {percent}%.
    </p>
  );
}

/**
 * Тренажёр задания №9: оболочка сессии вокруг конфигуратора и экрана.
 *
 * Задачи собираются в браузере генератором по seed. В хранилище идут
 * только их идентификаторы с подписями (packTrenazher9): целиком, с
 * набранными подсказками, тренировка весит мегабайты. При входе задачи
 * собираются заново и сверяются с подписью.
 */
export function Trenazher9({ base, backHref, groups, prototypesOf, openOf }: Trenazher9Props) {
  return (
    <TrainerSessionHost<Trenazher9Payload, Trenazher9Ui>
      scope={scopeOfPath(base) ?? '9'}
      what="тренажёр"
      backHref={backHref}
      isPayload={isTrenazher9Payload}
      count={(payload) => payload.tasks.length}
      pack={packTrenazher9}
      unpack={unpackTrenazher9}
      describe={(payload, at) => {
        const task = payload.tasks[at];
        if (task === undefined) {
          throw new Error('Нет задания');
        }
        return {
          kind: kindTitle(task.prototype),
          html: task.questionHtml,
          ...(isOpenId(task.id) ? { badge: 'Открытый банк' } : {}),
          /* Разбор открывается только здесь, на итогах: он закрыт
             отпечатком. Рисунок — со всеми построениями. */
          review: () => (
            <div className="z9-razbor">
              {task.risunok === null ? null : (
                <div className="chart ptask__chart z9-ptask__pic">
                  <Risunok9 figura={task.risunok} rezhim="teacher" />
                </div>
              )}
              <Razbor9 shagi={razborOf(task)} />
            </div>
          ),
        };
      }}
      subset={(payload, indexes) => ({
        ...payload,
        tasks: indexes.flatMap((at) => payload.tasks[at] ?? []),
      })}
      similar={similarTrenazher9}
      summary={{ extra: (data) => <Itog9 data={data} /> }}
      configurator={(api) => (
        <Trenazher9Configurator
          groups={groups}
          prototypesOf={prototypesOf}
          openOf={openOf}
          api={api}
        />
      )}
      screen={({ payload, restored, report, elapsed, finish }) => (
        <Trenazher9Screen
          tasks={payload.tasks}
          control={payload.control}
          restored={restored === null ? null : readTrenazher9Ui(restored)}
          report={report}
          elapsed={elapsed}
          onFinish={finish}
        />
      )}
    />
  );
}

/**
 * Конфигуратор тренировки №9: группы → режим → количество → источник.
 * «Начать тренировку» собирает задачи в браузере и отдаёт их оболочке
 * сессии: она сохранит тренировку и вернёт в неё после перехода на
 * другую вкладку или перезагрузки.
 */
function Trenazher9Configurator({
  groups,
  prototypesOf,
  openOf,
  api,
}: {
  groups: SkillItem[];
  prototypesOf: Record<string, number>;
  openOf: Record<string, number>;
  api: ConfiguratorApi<Trenazher9Payload>;
}) {
  const [istochnik, setIstochnik] = useIstochnik();
  const first = groups[0];
  const [selected, setSelected] = useState<string[]>(first === undefined ? [] : [first.id]);
  const [mode, setMode] = useState<TrainerModeId>('practice');
  const [count, setCount] = useState<number | null>(10);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) {
        window.clearTimeout(timer.current);
      }
    },
    [],
  );

  const progress = progress9.useProgress();

  const openTotal = Object.values(openOf).reduce((sum, n) => sum + n, 0);
  const open = istochnik === ISTOCHNIK_OTKRYTYJ && openTotal > 0;
  /* Открытого банка нет — тренажёр работает на сгенерированных. */
  const source = open ? ISTOCHNIK_OTKRYTYJ : ISTOCHNIK_SVOI;

  const countOf = (id: string): number =>
    open ? (openOf[id] ?? 0) : Math.min((prototypesOf[id] ?? 0) * 20, 1000);
  const sourceMistakes = progress.mistakes.filter((id) => isOpenId(id) === open);
  const hasMistakes = sourceMistakes.length > 0;

  function toggleGroup(id: string) {
    const next = selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id];
    if (next.length > 0) {
      setSelected(next);
    }
  }

  function launch(
    groupIds: string[],
    modeId: TrainerModeId,
    wanted: number,
    sourceId: typeof source,
  ) {
    setFailed(false);
    setLoading(true);
    /* Генератор считает рисунки в браузере: даём экрану нарисовать
       «Готовим задания…» и только потом начинаем. */
    timer.current = window.setTimeout(() => {
      const tasks = buildSession9({
        groups: groupIds,
        count: wanted,
        mode: modeId,
        istochnik: sourceId,
        mistakes: progress.mistakes,
        uzhe: Object.keys(progress.outcomes ?? {}),
      });
      setLoading(false);
      if (tasks.length === 0) {
        setFailed(true);
        return;
      }
      api.start({ tasks, control: modeId === 'control' });
    }, 40);
  }

  const picked = groups.filter((item) => selected.includes(item.id));
  const chosen = picked.length === 0 && first !== undefined ? [first] : picked;
  const chosenIds =
    mode === 'mixed' || mode === 'mistakes' ? allGroupIds() : chosen.map((item) => item.id);
  const chosenTotal = chosenIds.reduce((sum, id) => sum + countOf(id), 0);
  const chosenTitle =
    mode === 'mixed'
      ? 'Все группы'
      : mode === 'mistakes'
        ? 'Задачи с ошибками'
        : chosen.length === 1
          ? (chosen[0]?.title ?? '')
          : counted(chosen.length, 'группа', 'группы', 'групп');

  const allCount = Math.min(
    mode === 'mistakes' ? sourceMistakes.length : chosenTotal,
    open ? Number.POSITIVE_INFINITY : MAX_ALL,
  );
  const chosenCount =
    count === null ? allCount : mode === 'mistakes' ? Math.min(count, allCount) : count;
  const noTasks = mode === 'mistakes' ? !hasMistakes : chosenTotal === 0;
  const modeTitle = trainerModes.find((item) => item.id === mode)?.title ?? '';
  const sourceTitle = open ? 'Открытый банк' : 'Сгенерированные';
  const single =
    chosen.length === 1 && mode !== 'mixed' && mode !== 'mistakes' ? chosen[0] : undefined;

  const items: SkillItem[] = groups.map((item) => ({
    ...item,
    count: countOf(item.id),
    code: `Группа ${item.id} · ${
      open
        ? counted(openOf[item.id] ?? 0, 'задача', 'задачи', 'задач')
        : counted(prototypesOf[item.id] ?? 0, 'тип', 'типа', 'типов')
    }`,
  }));

  const countText = counted(Math.max(chosenCount, 0), 'задание', 'задания', 'заданий');

  return (
    <div className="cfg">
      <h3 className="t-h3 cfg__title">{trainerPage.builder}</h3>

      <div className="cfg__layout">
        <div className="cfg__steps">
          <section className="cfg-step" aria-labelledby="z9-step-skill">
            <StepHead
              id="z9-step-skill"
              no={trainerPage.skill.step}
              title="Выбери группы задач"
              lead={`Что хочешь потренировать в разделе «${PROIZVODNAYA.title}»? Можно выбрать несколько групп.`}
            />
            <div className="z9-skills">
              <SkillCards
                items={items}
                selected={chosen.map((item) => item.id)}
                onToggle={toggleGroup}
                multiple
                labelledBy="z9-step-skill"
              />
            </div>
          </section>

          <section className="cfg-step" aria-labelledby="z9-step-params">
            <StepHead
              id="z9-step-params"
              no={trainerPage.params.step}
              title="Настрой параметры тренировки"
              lead="Выбери формат, количество заданий и источник задач"
            />
            <div className="cfg-params">
              <OptionGroup id="z9-param-mode" label={trainerPage.params.mode}>
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

              <OptionGroup id="z9-param-count" label={trainerPage.params.count} compact>
                {COUNTS.map((item) => (
                  <Option
                    key={item ?? 'all'}
                    checked={count === item}
                    onSelect={() => setCount(item)}
                    title={item === null ? `${trainerPage.params.all} (${allCount})` : item}
                  />
                ))}
              </OptionGroup>

              <OptionGroup id="z9-param-source" label="Источник заданий">
                <Option
                  checked={open}
                  disabled={openTotal === 0}
                  onSelect={() => setIstochnik(ISTOCHNIK_OTKRYTYJ)}
                  title="Только открытый банк"
                  lead={
                    openTotal === 0
                      ? 'Задач из открытого банка пока нет'
                      : `Задачи из открытого банка ФИПИ: ${openTotal}`
                  }
                />
                <Option
                  checked={!open}
                  onSelect={() => setIstochnik(ISTOCHNIK_SVOI)}
                  title="Только сгенерированные"
                  lead="Новые задачи: каждый раз другие числа и графики"
                />
              </OptionGroup>
              {openTotal === 0 ? (
                <p className="z9-source-note t-caption">
                  Задач из открытого банка пока нет, поэтому тренировка идёт на сгенерированных
                  задачах. Режим «Только открытый банк» включится, когда задачи добавят.
                </p>
              ) : null}
            </div>
          </section>
        </div>

        <aside className="cfg-summary" aria-labelledby="z9-summary-title">
          <h3 className="cfg-summary__title" id="z9-summary-title">
            {trainerPage.summary.title}
          </h3>
          <Badge tone="info">{PROIZVODNAYA.title}</Badge>
          <p className="cfg-summary__skill">{chosenTitle}</p>
          <p className="cfg-summary__count">{countText}</p>
          {single === undefined ? null : (
            <div className="cfg-summary__chart z9-chart z9-chart--big" aria-hidden="true">
              {single.chart}
            </div>
          )}
          <Note>{trainerPage.summary.note}</Note>
        </aside>
      </div>

      <div className="cfg-bar">
        <Button
          className="cfg-bar__start"
          size="lg"
          loading={loading}
          disabled={noTasks || chosenCount <= 0}
          onClick={() => launch(chosenIds, mode, chosenCount, source)}
        >
          {loading ? 'Готовим задания…' : trainerPage.start}
        </Button>
        <p className="cfg-bar__summary">
          {PROIZVODNAYA.title} · {chosenTitle} · {modeTitle} · {countText} · {sourceTitle}
        </p>
      </div>
      {failed ? (
        <p className="z9-source-note t-caption" role="alert">
          {mode === 'mistakes'
            ? 'Задач с ошибками для повторения не нашлось.'
            : 'Не удалось собрать задания. Попробуйте ещё раз или выберите другие группы.'}
        </p>
      ) : null}

      <Trenazher9Stats />
    </div>
  );
}
