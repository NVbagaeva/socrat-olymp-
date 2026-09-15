'use client';

import { ProgressRing } from '@/components/ui';
import { useAppState } from '@/state/AppState';

export interface TopicProgressProps {
  /** Сколько всего разделов теории у темы: длина её списка. */
  total: number;
}

/**
 * Прогресс по разделам теории темы в шапке.
 *
 * Общее число не хранится и нигде не записано: оно приходит длиной
 * списка разделов — того же, из которого строится «Содержание».
 * Изучено приходит из состояния, а оно из прослойки хранилища:
 * страница ничего не знает ни про localStorage, ни про то, что
 * стартовое число пока демонстрационное.
 */
export function TopicProgress({ total }: TopicProgressProps) {
  const { studied } = useAppState();
  /* Сохранённое «изучено» может обогнать список, если разделов стало
     меньше. Показывать «14 из 13» нельзя, поэтому число подрезается
     по длине списка. */
  const done = Math.min(studied, total);
  const percent = total === 0 ? 0 : (done / total) * 100;
  const text = `Вы изучили ${done} из ${total} разделов`;

  return (
    <div className="topic-progress">
      <ProgressRing value={percent} label="разделов" srLabel={text} />
      <p className="topic-progress__text">{text}</p>
    </div>
  );
}
