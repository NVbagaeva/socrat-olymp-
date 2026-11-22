import type { Metadata } from 'next';
import { ProgressVariant } from '@/components/progressUchitel/ProgressVariant';
import { ProgressStranitsa } from '@/components/progressUchitel/ProgressStranitsa';
import { PROGRESS_UCHENIK_ON, PROGRESS_UCHITEL_ON } from '@/lib/zhurnal/config';

export const metadata: Metadata = {
  title: 'Вариант — Будет на ЕГЭ',
  robots: { index: false },
};

/** Вариант ученика по задачам: учителю — ?u=&id=, ученику — ?id=. */
export default function Page() {
  return (
    <ProgressStranitsa vkl={PROGRESS_UCHITEL_ON || PROGRESS_UCHENIK_ON}>
      <ProgressVariant />
    </ProgressStranitsa>
  );
}
