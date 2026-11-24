import type { Metadata } from 'next';
import { Dz2Stranitsa } from '@/components/dz2/Dz2Stranitsa';
import { Itogi } from '@/components/dz2/Itogi';

export const metadata: Metadata = {
  title: 'Итоги ДЗ — Будет на ЕГЭ',
  robots: { index: false },
};

/** Итоги ДЗ у учителя: «ученики × элементы», ответы, возврат (docs/kabinet-dz2.md, PR 2г). */
export default function Page() {
  return (
    <Dz2Stranitsa>
      <Itogi />
    </Dz2Stranitsa>
  );
}
