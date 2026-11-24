import type { Metadata } from 'next';
import { Opornye18 } from '@/components/zadanie18/Opornye18';
import { vkladka18, zadanie18Title } from '@/content/zadanie18';

const VKLADKA = vkladka18('opornye');

export const metadata: Metadata = {
  title: zadanie18Title(VKLADKA),
};

/** Вкладка «Опорные задачи» №18: задачи по темам ключевых схем. Страницы задач — [zadacha]/. */
export default function Opornye18Tab() {
  return <Opornye18 vkladka={VKLADKA} />;
}
