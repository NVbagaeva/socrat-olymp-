'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Badge, Button } from '@/components/ui';
import { Note, Option, OptionGroup, SkillCards, StepHead, type SkillItem } from '../configurator';
import { trainerModes, trainerPage, type TrainerModeId } from '@/content/trainerModes';
import { VYCHISLENIYA } from '@/content/vychisleniya';
import { counted } from '@/lib/plural';
import { closedTasks, mistakes as openMistakes } from '@/lib/progressLog';
import { OSHIBKI8 } from '@/lib/vychisleniya/links';
import { log8 } from '@/lib/vychisleniya/progress';
import {
  BANK_TOTAL,
  buildMistakes8,
  buildSession8,
  kindTitle,
  prototypeOfTask,
  taskById,
} from '@/lib/vychisleniya/session';
import { LEVELS } from '@/lib/vychisleniya/skills';
import type { Level } from '@/lib/vychisleniya/types';
import { scopeOfPath } from '@/lib/trainerSession/scope';
import { TrainerSessionHost, type ConfiguratorApi } from '../session';
import { Trenazher8Screen, razborOf } from './Trenazher8Screen';
import { Progress8, type Names8 } from './Progress8';
import {
  isTrenazher8Payload,
  packTrenazher8,
  similarTrenazher8,
  unpackTrenazher8,
  type Trenazher8Payload,
} from './trenazher8Payload';
import { readTrenazher8Ui, type Trenazher8Ui } from './trenazher8Ui';

export interface Trenazher8Props {
  /** Адрес вкладки: туда ведёт кнопка возврата с итогового экрана. */
  base: string;
  /** Карточки навыков: собраны на сервере, формулы набраны KaTeX. */
  skills: SkillItem[];
  /** Сколько заданий во всём банке раздела. */
  total: number;
  /** Названия прототипов, набранные KaTeX на сборке. */
  names: Names8;
}

const COUNTS: (number | null)[] = [5, 10, 20, null];

/**
 * Режимы №8: те же, что у других тренажёров, но вместо «Повтора ошибок»
 * — «Работа над ошибками»: новые задачи того же типа, а не те же самые.
 */
const MODES8 = trainerModes.map((item) =>
  item.id === 'mistakes'
    ? { ...item, title: 'Работа над ошибками', lead: 'Новые задачи того же типа, что и ошибки' }
    : item,
);

/**
 * Тренажёр задания №8: оболочка сессии вокруг конфигуратора и экрана.
 * Задания собираются в браузере; в хранилище уходит только рецепт
 * (идентификаторы задач и подписи), открытые числа туда не попадают.
 */
export function Trenazher8({ base, skills, total, names }: Trenazher8Props) {
  /* Вход по ссылке: одна задача из закладки (?zadacha=) или «Работа над
     ошибками» (?rezhim=oshibki). Читается до первой отрисовки оболочки:
     при незавершённой тренировке она спросит, продолжить её или начать
     новую по ссылке. */
  const [intent] = useState<Intent>(readIntent);
  return (
    <TrainerSessionHost<Trenazher8Payload, Trenazher8Ui>
      scope={scopeOfPath(base) ?? '8'}
      what="тренажёр"
      backHref={base}
      entryIntent={intent !== null}
      onEntryResolved={clearIntent}
      isPayload={isTrenazher8Payload}
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
          review: () => (
            <ol className="z8-razbor__steps">
              {razborOf(task).map((line, i) => (
                <li key={i} dangerouslySetInnerHTML={{ __html: line }} />
              ))}
            </ol>
          ),
        };
      }}
      /* «Прорешать те же задачи» нет: повтор той же задачи ничего не
         проверяет. Вместо него — «Похожие задачи»: новые аналоги. */
      similar={similarTrenazher8}
      /* В записи — рецепт (идентификаторы и подписи): задачи по нему
         собираются заново тем же генератором. */
      pack={packTrenazher8}
      unpack={unpackTrenazher8}
      summary={{
        hintedLabel: 'Решено с открытым решением',
        showWeak: true,
        extra: () => <MistakesLink />,
      }}
      configurator={(api) => (
        <Trenazher8Configurator
          skills={skills}
          total={total}
          names={names}
          api={api}
          intent={intent}
        />
      )}
      screen={({ payload, sessionId, restored, report, elapsed, finish }) => (
        <Trenazher8Screen
          pool={payload.tasks}
          roundKey={sessionId}
          restored={restored === null ? null : readTrenazher8Ui(restored)}
          report={report}
          elapsed={elapsed}
          onFinish={finish}
          control={payload.control}
        />
      )}
    />
  );
}

type Intent = { kind: 'zadacha'; id: string } | { kind: 'oshibki' } | null;

function readIntent(): Intent {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const id = params.get('zadacha');
  if (id !== null && taskById(id) !== null) return { kind: 'zadacha', id };
  if (params.get('rezhim') === 'oshibki') return { kind: 'oshibki' };
  return null;
}

/** Убрать параметры ссылки из адреса: вопрос о незавершённой тренировке не повторится. */
function clearIntent() {
  const url = new URL(window.location.href);
  url.searchParams.delete('zadacha');
  url.searchParams.delete('rezhim');
  window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
}

/** Под итогами: сколько задач в «Моих ошибках» и ссылка на работу над ними. */
function MistakesLink() {
  const log = log8.use();
  const open = openMistakes(log, prototypeOfTask);
  if (open.length === 0) return null;
  return (
    <p className="z8-sum-mistakes">
      В «Моих ошибках» — {counted(open.length, 'задача', 'задачи', 'задач')}.{' '}
      <Link href={OSHIBKI8}>Работа над ошибками →</Link>
    </p>
  );
}

/**
 * Конфигуратор тренировки №8: навыки → режим → количество → уровень.
 * Навыков можно выбрать несколько: «Отработка» и «Контроль» идут по
 * выбранным, «Смешанная» и «Повтор ошибок» — по всему банку.
 *
 * Тот же порядок шагов, что у №12, свой компонент. «Начать
 * тренировку» собирает задачи в браузере: генератор считает свежие
 * числа, ответы сразу закрываются отпечатком.
 */
function Trenazher8Configurator({
  skills,
  total,
  names,
  api,
  intent,
}: {
  skills: SkillItem[];
  total: number;
  names: Names8;
  api: ConfiguratorApi<Trenazher8Payload>;
  intent: Intent;
}) {
  const first = skills[0];
  /* Навыков можно выбрать несколько; последний снять нельзя. */
  const [selected, setSelected] = useState<string[]>(first === undefined ? [] : [first.id]);
  const [mode, setMode] = useState<TrainerModeId>(
    intent?.kind === 'oshibki' ? 'mistakes' : 'practice',
  );
  /* Закладка: одна задача сразу, без выбора тренировки. Один раз. */
  const opened = useRef(false);
  useEffect(() => {
    if (opened.current || intent?.kind !== 'zadacha') return;
    opened.current = true;
    const task = taskById(intent.id);
    if (task !== null) api.start({ tasks: [task], control: false });
  }, [intent, api]);
  const [count, setCount] = useState<number | null>(10);
  const [level, setLevel] = useState<Level>('base');

  /* Журнал только читается: «Работа над ошибками» доступна, когда есть
     ошибки; задачи банка, которые уже решались, не повторяются. */
  const log = log8.use();
  const mistakeList = openMistakes(log, prototypeOfTask);
  const hasMistakes = mistakeList.length > 0;

  function toggleSkill(id: string) {
    const next = selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id];
    if (next.length > 0) {
      setSelected(next);
    }
  }

  const picked = skills.filter((item) => selected.includes(item.id));
  const skill = picked[0] ?? first;
  if (skill === undefined) {
    return null;
  }
  const chosen = picked.length === 0 ? [skill] : picked;
  const chosenTotal = chosen.reduce((sum, item) => sum + item.count, 0);
  /* В строке сводки: один навык — названием, два — через «и», больше — числом. */
  const chosenTitle =
    mode === 'mixed'
      ? 'Все навыки'
      : chosen.length === 1
        ? skill.title
        : chosen.length === 2
          ? chosen.map((item) => item.title).join(' и ')
          : counted(chosen.length, 'навык', 'навыка', 'навыков');

  const allCount =
    mode === 'mixed' ? total : mode === 'mistakes' ? mistakeList.length * 2 : chosenTotal;
  const modeTitle = MODES8.find((item) => item.id === mode)?.title ?? '';
  const chosenCount = count ?? allCount;

  function start() {
    if (skill === undefined) {
      return;
    }
    const tasks = buildSession8({
      skills:
        mode === 'mixed' || mode === 'mistakes'
          ? skills.map((item) => item.id)
          : chosen.map((item) => item.id),
      level: mode === 'mistakes' ? null : level,
      count: chosenCount,
      mode,
      mistakes: mistakeList,
      closed: closedTasks(log),
    });
    if (tasks.length === 0) {
      return;
    }
    /* Оболочка сессии сохранит рецепт заданий и вернёт ученика в них. */
    api.start({ tasks, control: mode === 'control' });
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
              <SkillCards
                items={skills}
                selected={chosen.map((item) => item.id)}
                onToggle={toggleSkill}
                multiple
                labelledBy="z8-step-skill"
              />
            </div>
          </section>

          <section className="cfg-step" aria-labelledby="z8-step-params">
            <StepHead
              id="z8-step-params"
              no={trainerPage.params.step}
              title={trainerPage.params.title}
              lead={trainerPage.params.lead}
            />
            <div className="cfg-params">
              <OptionGroup id="z8-param-mode" label={trainerPage.params.mode}>
                {MODES8.map((item) => {
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
                    <Option
                      key={item.id}
                      checked={level === item.id}
                      onSelect={() => setLevel(item.id)}
                      title={item.nazvanie}
                      lead={item.lead}
                    />
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
          <p className="cfg-summary__skill">{chosenTitle}</p>
          <p className="cfg-summary__count">
            {counted(chosenCount, 'задание', 'задания', 'заданий')}
          </p>
          {chosen.length === 1 && mode !== 'mixed' ? (
            <div className="cfg-summary__chart z8-formula z8-formula--big" aria-hidden="true">
              {skill.chart}
            </div>
          ) : null}
          <Note>{trainerPage.summary.note}</Note>
        </aside>
      </div>

      <div className="cfg-bar">
        <Button className="cfg-bar__start" size="lg" onClick={start}>
          {trainerPage.start}
        </Button>
        <p className="cfg-bar__summary">
          {VYCHISLENIYA.title} · {chosenTitle} · {modeTitle} ·{' '}
          {counted(chosenCount, 'задание', 'задания', 'заданий')}
        </p>
      </div>

      <Progress8
        total={BANK_TOTAL}
        names={names}
        onFixMistakes={() => {
          const tasks = buildMistakes8(mistakeList, Math.min(20, mistakeList.length * 2));
          if (tasks.length > 0) api.start({ tasks, control: false });
        }}
      />
    </div>
  );
}
