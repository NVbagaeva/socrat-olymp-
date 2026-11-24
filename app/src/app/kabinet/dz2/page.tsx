import type { Metadata } from 'next';
import { Dz2Stranitsa } from '@/components/dz2/Dz2Stranitsa';
import { SpisokDz2 } from '@/components/dz2/SpisokDz2';

export const metadata: Metadata = {
  title: 'Домашние задания — Будет на ЕГЭ',
  robots: { index: false },
};

/** ДЗ учителя: черновики, шаблоны, выданные (docs/kabinet-dz2.md). */
export default function Page() {
  return (
    <Dz2Stranitsa>
      <SpisokDz2 />
    </Dz2Stranitsa>
  );
}
