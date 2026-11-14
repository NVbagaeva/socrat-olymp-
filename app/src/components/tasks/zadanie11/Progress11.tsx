'use client';

import { ProgressRing } from '@/components/ui';
import { PROGRESS_11 } from '@/content/zadanie11';
import { kindStats } from '@/lib/progressLog';
import { mikroResheno11, opornye11, TEORIYA_KEY_11 } from '@/lib/zadanie11/progress';
import { log11 } from '@/lib/zadanie11/trening/progress';
import { useSectionsRead } from '@/lib/theoryRead';

/**
 * Кольцо прогресса задания №11 в шапке. Шаги: прочитанные разделы
 * теории, верно решённые опорные задачи и типы задач тренажёра,
 * решённые верно хотя бы раз (журнал тренажёра).
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
  const trenazher = kindStats(log11.use(), (kind) => kind);
  const total = razdely.length + bloki.reduce((sum, b) => sum + b.total, 0) + podtipy.length;
  const done = Math.min(
    razdely.filter((id) => read.includes(id)).length +
      bloki.reduce((sum, b) => sum + mikroResheno11(opornye, b.id, b.total), 0) +
      podtipy.filter((id) => (trenazher.get(id)?.right ?? 0) > 0).length,
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
