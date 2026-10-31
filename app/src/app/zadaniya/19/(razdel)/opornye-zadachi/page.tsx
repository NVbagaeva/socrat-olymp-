import type { Metadata } from 'next';
import { Opornye19 } from '@/components/zadanie19/Opornye19';
import { ZADANIE19, zadanie19Title } from '@/content/zadanie19';

const VKLADKA = ZADANIE19.tabs.find((tab) => tab.id === 'opornye')?.label ?? '';

export const metadata: Metadata = {
  title: zadanie19Title(VKLADKA),
};

/** Вкладка «Опорные задачи» №19: опорные задачи глав методов. */
export default function Opornye19Tab() {
  return <Opornye19 vkladka={VKLADKA} />;
}
