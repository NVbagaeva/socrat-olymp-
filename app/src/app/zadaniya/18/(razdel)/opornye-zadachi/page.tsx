import type { Metadata } from 'next';
import { Opornye18Spisok } from '@/components/zadanie18/Opornye18Spisok';
import { vkladka18, zadanie18Title } from '@/content/zadanie18';

export const metadata: Metadata = {
  title: zadanie18Title(vkladka18('opornye')),
};

/** Вкладка «Опорные задачи»: задачи уровня ЕГЭ через ключевые схемы. Страницы задач — [zadacha]/. */
export default function Opornye18Tab() {
  return <Opornye18Spisok />;
}
