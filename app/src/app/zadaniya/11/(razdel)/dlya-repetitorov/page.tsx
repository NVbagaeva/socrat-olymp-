import type { Metadata } from 'next';
import { EmptyState } from '@/components/ui';
import { SKORO_11, ZADANIE11, zadanie11Title } from '@/content/zadanie11';

const VKLADKA = ZADANIE11.tabs.find((tab) => tab.id === 'repetitory')?.label ?? '';

export const metadata: Metadata = {
  title: zadanie11Title(VKLADKA),
};

/**
 * Вкладка задания №11. Данные и движок уже собраны
 * (lib/zadanie11), экран вкладки — в следующих частях раздела;
 * до тех пор вкладка честно об этом говорит.
 */
export default function Repetitory11Tab() {
  return <EmptyState title={SKORO_11.title} description={SKORO_11.text} />;
}
