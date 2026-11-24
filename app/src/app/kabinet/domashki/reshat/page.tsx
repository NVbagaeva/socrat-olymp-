import type { Metadata } from 'next';
import { Dz2Stranitsa } from '@/components/dz2/Dz2Stranitsa';
import { ReshenieDz2 } from '@/components/dz2/ReshenieDz2';

export const metadata: Metadata = {
  title: 'Домашнее задание — Будет на ЕГЭ',
  robots: { index: false },
};

/** Ученик решает ДЗ новой выдачи: ?id=… (docs/kabinet-dz2.md, PR 2в). */
export default function Page() {
  return (
    <Dz2Stranitsa>
      <ReshenieDz2 />
    </Dz2Stranitsa>
  );
}
