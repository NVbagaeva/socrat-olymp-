'use client';

import { useState } from 'react';
import type { SkillItem } from '../configurator';
import { trainerKindTitle, trainerModes, type TrainerModeId } from '@/content/trainerModes';
import type { SkillLevel } from '@/content/skills12';
import { useTrainerProgress } from '@/lib/trainerProgress';
import { TrainerSessionHost, type ConfiguratorApi } from '../session';
import {
  TrainerConfigurator,
  type ConfiguratorPreset,
  type TrainerModeOption,
  type TrainerRequest,
  type TrainerWords,
} from './TrainerConfigurator';
import { TrainerScreen } from './TrainerScreen';
import { TrainerStats } from './TrainerStats';
import { isTrainerPayload, type TrainerPayload } from './trainerPayload';
import { TrainerReview } from './TrainerReview';
import { readTrainerUi, type TrainerUi } from './trainerUi';

/** Ярлык задания №12: набор движка и режим. */
export type TrainerPreset = ConfiguratorPreset<TrainerModeId>;

export interface TrainerBuilderProps {
  /** Адрес вкладки: туда ведёт кнопка возврата с итогового экрана. */
  base: string;
  /** Раздел тренировки для сохранения: «12:linear». */
  scope: string;
  /** Название семейства: в подзаголовке, бейдже и сводке. */
  family: string;
  /** Сколько задач во всех наборах прототипов семейства. */
  familyTotal: number;
  skills: SkillItem[];
  /** Подписи уровней подтемы. */
  levels?: readonly SkillLevel[];
  /** Подписи конфигуратора подтемы. */
  words?: TrainerWords;
  /** Принимать задачи с ответом выбором варианта: признак подтемы. */
  choice?: boolean;
  /** Что выбрано при заходе: ярлык прежнего адреса или ничего. */
  preset?: TrainerPreset | null;
}

/**
 * Тренажёр задания №12: конфигуратор и сессия движка graph/.
 *
 * Сам конфигуратор общий для всех тренажёров (TrainerConfigurator);
 * здесь — то, что знает только задание №12: история ошибок, сборка
 * сессии со свежими числами и экран задания. «Начать тренировку»
 * собирает сессию тут же, в браузере, — движок считает свежие числа
 * и ответы, и экран задания встаёт на место конфигуратора. Ни
 * задания, ни ответы в разметку страницы не попадают.
 */
export function TrainerBuilder({
  base,
  scope,
  family,
  familyTotal,
  skills,
  levels,
  words,
  choice = false,
  preset = null,
}: TrainerBuilderProps) {
  const [starting, setStarting] = useState(false);

  /* История ошибок читается, но не пишется: «Повтор ошибок» есть
     только тогда, когда ученику есть что повторять. */
  const progress = useTrainerProgress();

  /* Ошибки этого семейства: по ним считается «Все» и потолок «Своё»
     в «Повторе ошибок». */
  const familyMistakes = progress.mistakes.filter((id) =>
    skills.some((item) => id.startsWith(`${item.id}-`)),
  ).length;

  /* «Все» в смешанной тренировке — все наборы семейства. */
  const modes: TrainerModeOption<TrainerModeId>[] = trainerModes.map((item) =>
    item.id === 'mixed'
      ? { ...item, total: familyTotal }
      : item.id === 'mistakes'
        ? { ...item, total: familyMistakes, locked: familyMistakes === 0 }
        : item,
  );

  /* Движок задач и KaTeX весят сотни килобайт и нужны только здесь, по
     «Начать тренировку»: на странице темы они не грузятся, а
     подтягиваются по нажатию, пока на кнопке крутится ожидание. */
  async function start(
    request: TrainerRequest<TrainerModeId>,
    begin: ConfiguratorApi<TrainerPayload>['start'],
  ) {
    if (starting) {
      return;
    }
    setStarting(true);
    try {
      const { buildSession } = await import('@/lib/trainerSession');
      const { mode } = request;
      const session = buildSession({
        /* Отработка и контроль — по выбранным типам, остальное — по всем. */
        skills:
          mode === 'mixed' || mode === 'mistakes'
            ? skills.map((item) => item.id)
            : request.skills.map((item) => item.id),
        level: mode === 'mistakes' ? null : request.level,
        count: request.count,
        mode,
        mistakes: progress.mistakes,
        choice,
      });
      if (session.tasks.length === 0) {
        return;
      }
      /* Оболочка сессии сохранит задания целиком и вернёт ученика
         в них при любом заходе, пока тренировка не завершена. */
      begin({ tasks: session.tasks, control: mode === 'control' });
    } finally {
      setStarting(false);
    }
  }

  return (
    <TrainerSessionHost<TrainerPayload, TrainerUi>
      scope={scope}
      what="тренажёр"
      backHref={base}
      isPayload={isTrainerPayload}
      count={(payload) => payload.tasks.length}
      describe={(payload, at) => {
        const task = payload.tasks[at];
        if (task === undefined) {
          throw new Error('Нет задания');
        }
        return {
          kind: trainerKindTitle[task.kind] ?? task.kind,
          html: task.questionHtml,
          /* В контроле разбора до конца сессии нет; на итогах он уже уместен. */
          review: () => <TrainerReview task={task} />,
        };
      }}
      subset={(payload, indexes) => ({
        ...payload,
        tasks: indexes.flatMap((at) => payload.tasks[at] ?? []),
      })}
      configurator={(api) => (
        <TrainerConfigurator
          family={family}
          skills={skills}
          modes={modes}
          preset={preset}
          {...(levels === undefined ? {} : { levels })}
          {...(words === undefined ? {} : { words })}
          onStart={(request) => start(request, api.start)}
          starting={starting}
          /* Что уже сделано: знаменатель — все задания прототипов семейства. */
          stats={<TrainerStats total={familyTotal} />}
        />
      )}
      screen={({ payload, sessionId, restored, report, elapsed, finish }) => (
        <TrainerScreen
          pool={payload.tasks}
          roundKey={sessionId}
          restored={restored === null ? null : readTrainerUi(restored)}
          report={report}
          elapsed={elapsed}
          onFinish={finish}
          control={payload.control}
        />
      )}
    />
  );
}
