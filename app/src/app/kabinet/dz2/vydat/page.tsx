import type { Metadata } from 'next';
import { Dz2Stranitsa } from '@/components/dz2/Dz2Stranitsa';
import { Vydacha } from '@/components/dz2/Vydacha';

export const metadata: Metadata = {
  title: 'Выдать домашнее задание — Будет на ЕГЭ',
  robots: { index: false },
};

/** Мастер выдачи: корзина «В домашку», настройки, кому. Черновик — ?id=. */
export default function Page() {
  return (
    <Dz2Stranitsa>
      <Vydacha />
    </Dz2Stranitsa>
  );
}
