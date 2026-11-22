import type { Metadata } from 'next';
import { ProgressZadacha } from '@/components/progressUchitel/ProgressZadacha';
import { ProgressStranitsa } from '@/components/progressUchitel/ProgressStranitsa';
import { PROGRESS_UCHITEL_ON } from '@/lib/zhurnal/config';

export const metadata: Metadata = {
  title: 'Задача ученика — Будет на ЕГЭ',
  robots: { index: false },
};

/** Задача, как её видел ученик: попытки, подсказки, время. ?u=&id=. */
export default function Page() {
  return (
    <ProgressStranitsa vkl={PROGRESS_UCHITEL_ON}>
      <ProgressZadacha />
    </ProgressStranitsa>
  );
}
