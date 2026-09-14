'use client';

import { ProgressRing } from '@/components/ui';
import { useAppState } from '@/state/AppState';

/**
 * Прогресс по разделам темы.
 *
 * Значение приходит из состояния, а оно — из прослойки хранилища:
 * страница ничего не знает ни про localStorage, ни про то, что
 * стартовая пара пока демонстрационная.
 */
export function TopicProgress() {
  const { studied } = useAppState();
  const percent = studied.total === 0 ? 0 : (studied.studied / studied.total) * 100;
  const text = `Вы изучили ${studied.studied} из ${studied.total} разделов`;

  return (
    <div className="topic-progress">
      <ProgressRing value={percent} label="разделов" srLabel={text} />
      <p className="topic-progress__text">{text}</p>
    </div>
  );
}
