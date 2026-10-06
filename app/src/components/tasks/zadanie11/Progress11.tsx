'use client';

import { ProgressRing } from '@/components/ui';
import { PROGRESS_11 } from '@/content/zadanie11';
import { TEORIYA_KEY_11 } from '@/lib/zadanie11/progress';
import { useSectionsRead } from '@/lib/theoryRead';

/**
 * Кольцо прогресса задания №11 в шапке. Считаются только вкладки,
 * которые уже есть на сайте: сейчас — прочитанные разделы теории.
 * Опорные задачи и тренажёр добавятся в сумму вместе со своими
 * вкладками.
 */
export function Progress11({ razdely }: { razdely: readonly string[] }) {
  const read = useSectionsRead(TEORIYA_KEY_11);
  const total = razdely.length;
  const done = Math.min(razdely.filter((id) => read.includes(id)).length, total);
  const text = PROGRESS_11.text(done, total);
  return (
    <div className="topic-progress">
      <ProgressRing
        value={total === 0 ? 0 : (done / total) * 100}
        label={PROGRESS_11.label}
        srLabel={text}
      />
      <p className="topic-progress__text">{text}</p>
    </div>
  );
}
