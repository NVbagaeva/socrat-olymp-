'use client';

import { ProgressRing } from '@/components/ui';
import { PROGRESS_1 } from '@/content/zadanie1';
import { useSectionsRead } from '@/lib/theoryRead';

/**
 * Кольцо прогресса раздела №1, как у №2 и №11: пока у раздела одна
 * вкладка — прочитанные разделы теории (lib/theoryRead).
 */
export function Progress1({ razdely }: { razdely: readonly string[] }) {
  const read = useSectionsRead(PROGRESS_1.teoriyaKey);
  const total = razdely.length;
  const done = razdely.filter((id) => read.includes(id)).length;
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
