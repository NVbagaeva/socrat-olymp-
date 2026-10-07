'use client';

import { ProgressRing } from '@/components/ui';
import { PROGRESS_11 } from '@/content/zadanie11';
import { mikroResheno11, opornye11, TEORIYA_KEY_11, trenazher11 } from '@/lib/zadanie11/progress';
import { useSectionsRead } from '@/lib/theoryRead';

/**
 * Кольцо прогресса задания №11 в шапке. Шаги: прочитанные разделы
 * теории, верно решённые опорные задачи и типы задач тренажёра,
 * решённые верно хотя бы раз (тот же счёт, что «решено N%» на
 * карте разделов).
 */
export function Progress11({
  razdely,
  bloki,
  podtipy,
}: {
  razdely: readonly string[];
  bloki: readonly { id: string; total: number }[];
  /** Подтипы тренажёра. */
  podtipy: readonly string[];
}) {
  const read = useSectionsRead(TEORIYA_KEY_11);
  const opornye = opornye11.useProgress();
  const trenazher = trenazher11.useProgress();
  const total = razdely.length + bloki.reduce((sum, b) => sum + b.total, 0) + podtipy.length;
  const done = Math.min(
    razdely.filter((id) => read.includes(id)).length +
      bloki.reduce((sum, b) => sum + mikroResheno11(opornye, b.id, b.total), 0) +
      podtipy.filter((id) => (trenazher.kinds[id]?.right ?? 0) > 0).length,
    total,
  );
  const text = PROGRESS_11.text(done, total);
  const sostav = PROGRESS_11.sostav(
    razdely.length,
    bloki.reduce((sum, b) => sum + b.total, 0),
    podtipy.length,
  );
  return (
    <div className="topic-progress" title={sostav}>
      <ProgressRing
        value={total === 0 ? 0 : (done / total) * 100}
        label={PROGRESS_11.label}
        srLabel={text}
      />
      <p className="topic-progress__text">{text}</p>
      <p className="topic-progress__note z11-progress__note">{sostav}</p>
    </div>
  );
}
