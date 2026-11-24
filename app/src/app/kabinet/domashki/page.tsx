import type { Metadata } from 'next';
import { Dz2Stranitsa } from '@/components/dz2/Dz2Stranitsa';
import { MoiDomashki } from '@/components/dz2/MoiDomashki';

export const metadata: Metadata = {
  title: 'Мои домашки — Будет на ЕГЭ',
  robots: { index: false },
};

/** «Мои домашки» ученика: ДЗ новой выдачи (docs/kabinet-dz2.md, PR 2в). */
export default function Page() {
  return (
    <Dz2Stranitsa>
      <MoiDomashki />
    </Dz2Stranitsa>
  );
}
