import type { Metadata } from 'next';
import { ProgressPechat } from '@/components/progressUchitel/ProgressPechat';
import { ProgressStranitsa } from '@/components/progressUchitel/ProgressStranitsa';
import { PROGRESS_UCHITEL_ON } from '@/lib/zhurnal/config';

export const metadata: Metadata = {
  title: 'Прогресс для печати — Будет на ЕГЭ',
  robots: { index: false },
};

/** Страница для PDF: ученик (?u=) или класс (?klass=), период и задание. */
export default function Page() {
  return (
    <ProgressStranitsa vkl={PROGRESS_UCHITEL_ON}>
      <ProgressPechat />
    </ProgressStranitsa>
  );
}
