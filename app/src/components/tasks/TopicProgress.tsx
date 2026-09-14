'use client';

import { ProgressRing } from '@/components/ui';
import { useAppState } from '@/state/AppState';

export interface TopicProgressProps {
  /** Сколько разделов в теме. Считается по содержанию, не хранится. */
  total: number;
}

/**
 * Прогресс по разделам темы.
 *
 * Сколько разделов прочитано — приходит из состояния, а оно из
 * прослойки хранилища: страница ничего не знает ни про localStorage,
 * ни про то, что стартовое число пока демонстрационное. Сколько
 * разделов всего — факт содержания темы, поэтому приходит сверху.
 */
export function TopicProgress({ total }: TopicProgressProps) {
  const { studied } = useAppState();
  /* Прочитанных не может быть больше, чем есть: содержание темы могло
     стать короче уже после того, как число сохранилось. */
  const done = Math.min(studied.studied, total);
  const percent = total === 0 ? 0 : (done / total) * 100;
  const text = `Вы изучили ${done} из ${total} разделов`;

  return (
    <div className="topic-progress">
      <ProgressRing value={percent} label="разделов" srLabel={text} />
      <p className="topic-progress__text">{text}</p>
    </div>
  );
}
