'use client';

import { ProgressRing } from '@/components/ui';
import { PROGRESS_2 } from '@/content/vektory';
import { useSectionsRead } from '@/lib/theoryRead';
import { kindStats } from '@/lib/progressLog';
import { mikroResheno, opornye2, TEORIYA_KEY_2 } from '@/lib/vektory/progress';
import { log2 } from '@/lib/vektory/trening/progress';

export interface Progress2Props {
  /** Идентификаторы разделов теории: прочитанные считаются по ним. */
  razdely: readonly string[];
  /** Блоки тренировок и число задач в каждом. */
  bloki: readonly { id: string; total: number }[];
  /** Прототипы тренажёра: каждый, решённый хоть раз верно, — шаг. */
  prototypes: readonly string[];
}

/**
 * Кольцо прогресса раздела в шапке задания №2.
 *
 * Считается по действиям: прочитанный раздел теории — шаг, верно
 * решённая микрозадача тренировок — шаг. Вкладки, которых на сайте
 * ещё нет, в сумму не входят. Прочитанные разделы берутся из
 * хранилища теории (lib/theoryRead), решённые задачи — из хранилища
 * тренировок, тренажёр — из журнала попыток; сохранённое может обогнать списки, если разделов или
 * задач стало меньше, поэтому сумма подрезается сверху.
 */
export function Progress2({ razdely, bloki, prototypes }: Progress2Props) {
  const read = useSectionsRead(TEORIYA_KEY_2);
  const progress = opornye2.useProgress();
  /* Тренажёр — общий журнал попыток (прежний ключ сворачивается в него). */
  const trenazher = kindStats(log2.use());
  const teoriya = razdely.filter((id) => read.includes(id)).length;
  const mikro = bloki.reduce((sum, b) => sum + mikroResheno(progress, b.id, b.total), 0);
  const resheno = prototypes.filter((id) => (trenazher.get(id)?.right ?? 0) > 0).length;
  const total = razdely.length + bloki.reduce((sum, b) => sum + b.total, 0) + prototypes.length;
  const done = Math.min(teoriya + mikro + resheno, total);
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
