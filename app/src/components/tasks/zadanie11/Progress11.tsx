'use client';

import { ProgressRing } from '@/components/ui';
import { PROGRESS_11 } from '@/content/zadanie11';
import { mikroResheno11, opornye11, TEORIYA_KEY_11 } from '@/lib/zadanie11/progress';
import { useSectionsRead } from '@/lib/theoryRead';

/**
 * Кольцо прогресса задания №11 в шапке. Считаются только вкладки,
 * которые уже есть на сайте: прочитанные разделы теории и верно
 * решённые опорные задачи. Тренажёр добавится в сумму вместе со
 * своей вкладкой.
 */
export function Progress11({
  razdely,
  bloki,
}: {
  razdely: readonly string[];
  bloki: readonly { id: string; total: number }[];
}) {
  const read = useSectionsRead(TEORIYA_KEY_11);
  const opornye = opornye11.useProgress();
  const total = razdely.length + bloki.reduce((sum, b) => sum + b.total, 0);
  const done = Math.min(
    razdely.filter((id) => read.includes(id)).length +
      bloki.reduce((sum, b) => sum + mikroResheno11(opornye, b.id, b.total), 0),
    total,
  );
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
