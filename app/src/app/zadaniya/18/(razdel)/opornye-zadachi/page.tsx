import type { Metadata } from 'next';
import { Opornye18Spisok } from '@/components/zadanie18/Opornye18Spisok';
import { metaVkladki } from '@/content/seo';

export const metadata: Metadata = metaVkladki(18, 'opornye');

/** Вкладка «Опорные задачи»: задачи уровня ЕГЭ через ключевые схемы. Страницы задач — [zadacha]/. */
export default function Opornye18Tab() {
  return <Opornye18Spisok />;
}
