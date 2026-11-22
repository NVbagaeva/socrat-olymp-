import type { Metadata } from 'next';
import { MoyaStatistika } from '@/components/progressUchitel/MoyaStatistika';
import { ProgressStranitsa } from '@/components/progressUchitel/ProgressStranitsa';
import { PROGRESS_UCHENIK_ON } from '@/lib/zhurnal/config';

export const metadata: Metadata = {
  title: 'Моя статистика — Будет на ЕГЭ',
  robots: { index: false },
};

/** «Моя статистика» ученика — без пометок для учителя. */
export default function Page() {
  return (
    <ProgressStranitsa vkl={PROGRESS_UCHENIK_ON}>
      <MoyaStatistika />
    </ProgressStranitsa>
  );
}
