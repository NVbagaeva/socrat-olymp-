import type { Metadata } from 'next';
import { Opornye19 } from '@/components/zadanie19/Opornye19';
import { ZADANIE19 } from '@/content/zadanie19';
import { metaVkladki } from '@/content/seo';

const VKLADKA = ZADANIE19.tabs.find((tab) => tab.id === 'opornye')?.label ?? '';

export const metadata: Metadata = metaVkladki(19, 'opornye');

/** Вкладка «Опорные задачи» №19: опорные задачи глав методов. */
export default function Opornye19Tab() {
  return <Opornye19 vkladka={VKLADKA} />;
}
