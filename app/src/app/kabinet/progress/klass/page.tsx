import type { Metadata } from 'next';
import { ProgressKlass } from '@/components/progressUchitel/ProgressKlass';
import { ProgressStranitsa } from '@/components/progressUchitel/ProgressStranitsa';
import { PROGRESS_UCHITEL_ON } from '@/lib/zhurnal/config';

export const metadata: Metadata = {
  title: 'Прогресс класса — Будет на ЕГЭ',
  robots: { index: false },
};

/** Прогресс класса для учителя: тепловая карта, активность, кто не начал ДЗ. Класс — в ?id=. */
export default function Page() {
  return (
    <ProgressStranitsa vkl={PROGRESS_UCHITEL_ON}>
      <ProgressKlass />
    </ProgressStranitsa>
  );
}
