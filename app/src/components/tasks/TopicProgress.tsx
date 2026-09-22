'use client';

import { Skeleton } from '@/components/ui';

export interface TopicProgressProps {
  /** Сколько всего разделов теории у темы. Пока не используется —
      см. докстроку ниже. */
  total: number;
}

/**
 * Прогресс по разделам теории темы в шапке.
 *
 * Раньше здесь было демонстрационное «6 из N»: настоящей отметки
 * «раздел прочитан» ещё не было, а число всё равно показывалось.
 * Отметку поставит сам ученик — кнопкой в конце раздела или
 * прохождением проверки понимания (этап 4). До тех пор честный
 * вид — нейтральная заглушка без единой цифры, а не число, которое
 * ничему не соответствует.
 */
export function TopicProgress({ total: _total }: TopicProgressProps) {
  return (
    <div className="topic-progress">
      <Skeleton width={56} height={56} radius="50%" />
      <Skeleton width={140} height={14} />
      <span className="sr-only">Отметки о прочитанных разделах теории появятся позже.</span>
    </div>
  );
}
