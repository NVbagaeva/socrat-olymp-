'use client';

import { ProgressRing } from '@/components/ui';
import { PROGRESS_2 } from '@/content/vektory';
import { useSectionsRead } from '@/lib/theoryRead';
import { mikroResheno, opornye2, TEORIYA_KEY_2 } from '@/lib/vektory/progress';

export interface Progress2Props {
  /** Идентификаторы разделов теории: прочитанные считаются по ним. */
  razdely: readonly string[];
  /** Блоки тренировок и число задач в каждом. */
  bloki: readonly { id: string; total: number }[];
}

/**
 * Кольцо прогресса раздела в шапке задания №2.
 *
 * Считается по действиям: прочитанный раздел теории — шаг, верно
 * решённая микрозадача тренировок — шаг. Вкладки, которых на сайте
 * ещё нет, в сумму не входят. Прочитанные разделы берутся из
 * хранилища теории (lib/theoryRead), решённые задачи — из хранилища
 * тренировок; сохранённое может обогнать списки, если разделов или
 * задач стало меньше, поэтому сумма подрезается сверху.
 */
export function Progress2({ razdely, bloki }: Progress2Props) {
  const read = useSectionsRead(TEORIYA_KEY_2);
  const progress = opornye2.useProgress();
  const teoriya = razdely.filter((id) => read.includes(id)).length;
  const mikro = bloki.reduce((sum, b) => sum + mikroResheno(progress, b.id, b.total), 0);
  const total = razdely.length + bloki.reduce((sum, b) => sum + b.total, 0);
  const done = Math.min(teoriya + mikro, total);
  const text = PROGRESS_2.text(done, total);

  return (
    <div className="topic-progress">
      <ProgressRing
        value={total === 0 ? 0 : (done / total) * 100}
        label={PROGRESS_2.label}
        srLabel={text}
      />
      <p className="topic-progress__text">{text}</p>
    </div>
  );
}
