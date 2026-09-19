'use client';

import { useState } from 'react';
import type { SkillItem } from '../configurator';
import { trainerModes, type TrainerModeId } from '@/content/trainerModes';
import { useTrainerProgress } from '@/lib/trainerProgress';
import { buildSession, type Session } from '@/lib/trainerSession';
import {
  TrainerConfigurator,
  type ConfiguratorPreset,
  type TrainerModeOption,
  type TrainerRequest,
} from './TrainerConfigurator';
import { TrainerScreen } from './TrainerScreen';
import { TrainerStats } from './TrainerStats';

/** Ярлык задания №12: набор движка и режим. */
export type TrainerPreset = ConfiguratorPreset<TrainerModeId>;

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
  family,
  familyTotal,
  skills,
  preset = null,
}: TrainerBuilderProps) {
  const [started, setStarted] = useState<Started | null>(null);

  /* История ошибок читается, но не пишется: «Повтор ошибок» есть
     только тогда, когда ученику есть что повторять. */
  const progress = useTrainerProgress();
  const hasMistakes = progress.mistakes.length > 0;

  /* «Все» в смешанной тренировке — все наборы семейства. */
  const modes: TrainerModeOption<TrainerModeId>[] = trainerModes.map((item) =>
    item.id === 'mixed'
      ? { ...item, total: familyTotal }
      : item.id === 'mistakes'
        ? { ...item, locked: !hasMistakes }
        : item,
  );

  function start(request: TrainerRequest<TrainerModeId>) {
    const { skill, mode } = request;
    const session = buildSession({
      skills: mode === 'mixed' || mode === 'mistakes' ? skills.map((item) => item.id) : [skill.id],
      level: mode === 'mistakes' ? null : request.level,
      count: request.count,
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

  return (
    <TrainerConfigurator
      family={family}
      skills={skills}
      modes={modes}
      preset={preset}
      onStart={start}
      /* Что уже сделано: знаменатель — все задания прототипов семейства. */
      stats={<TrainerStats total={familyTotal} />}
    />
  );
}
