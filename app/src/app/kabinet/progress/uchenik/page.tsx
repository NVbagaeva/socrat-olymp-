import type { Metadata } from 'next';
import { ProgressUchenik } from '@/components/progressUchitel/ProgressUchenik';
import { ProgressStranitsa } from '@/components/progressUchitel/ProgressStranitsa';
import { PROGRESS_UCHITEL_ON } from '@/lib/zhurnal/config';

export const metadata: Metadata = {
  title: 'Прогресс ученика — Будет на ЕГЭ',
  robots: { index: false },
};

/** Ученик глазами учителя: сводка, календарь, лента. Ученик — в ?id=. */
export default function Page() {
  return (
    <ProgressStranitsa vkl={PROGRESS_UCHITEL_ON}>
      <ProgressUchenik />
    </ProgressStranitsa>
  );
}
