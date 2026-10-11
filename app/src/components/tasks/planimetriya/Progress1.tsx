'use client';

import { ProgressRing } from '@/components/ui';
import { PROGRESS_1 } from '@/content/zadanie1';
import { mikroResheno, opornye1, progress1, TEORIYA_KEY_1 } from '@/lib/planimetriya/progress';
import { useSectionsRead } from '@/lib/theoryRead';

export interface Progress1Props {
  razdely: readonly string[];
  bloki: readonly { id: string; total: number }[];
  /** Прототипы тренажёра: ключи «p05». */
  podtipy: readonly string[];
}

/**
 * Кольцо прогресса раздела №1, как у №11: прочитанные разделы
 * теории, верно решённые микрозадачи тренировок и типы задач
 * тренажёра, решённые верно хотя бы раз.
 */
export function Progress1({ razdely, bloki, podtipy }: Progress1Props) {
  const read = useSectionsRead(TEORIYA_KEY_1);
  const progress = opornye1.useProgress();
  const trenazher = progress1.useProgress();
  const teoriya = razdely.filter((id) => read.includes(id)).length;
  const mikro = bloki.reduce((sum, b) => sum + mikroResheno(progress, b.id, b.total), 0);
  const tipy = podtipy.filter((id) => (trenazher.kinds[id]?.right ?? 0) > 0).length;
  const total = razdely.length + bloki.reduce((sum, b) => sum + b.total, 0) + podtipy.length;
  const done = Math.min(teoriya + mikro + tipy, total);
  const text = PROGRESS_1.text(done, total);
  return (
    <div className="topic-progress">
      <ProgressRing
        value={total === 0 ? 0 : (done / total) * 100}
        label={PROGRESS_1.label}
        srLabel={text}
      />
      <p className="topic-progress__text">{text}</p>
    </div>
  );
}
