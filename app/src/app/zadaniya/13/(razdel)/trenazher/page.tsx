import type { Metadata } from 'next';
import { Trenazher13Tab } from '@/components/tasks/zadanie13/Trenazher13Tab';
import { TRENAZHER13 } from '@/content/ekonomicheskie13';
import { zadanie13Title } from '@/content/zadanie13';
import { TRENAZHER13_HREF } from '@/lib/zadanie13/links';

export const metadata: Metadata = {
  title: zadanie13Title(TRENAZHER13.title),
};

/**
 * Вкладка «Тренажёр» №13. Сервер отдаёт названия типов и каталог ключей
 * задач; задачу, разбор и подсказки строит движок в браузере.
 */
export default function Trenazher13Page() {
  return <Trenazher13Tab base={TRENAZHER13_HREF} />;
}
