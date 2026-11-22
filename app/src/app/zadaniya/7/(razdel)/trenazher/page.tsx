import type { Metadata } from 'next';
import { Trenazher7Tab } from '@/components/tasks/zadanie7/Trenazher7Tab';
import { zadanie7Title } from '@/content/zadanie7';
import { TRENAZHER7_HREF } from '@/lib/zadanie7/links';

export const metadata: Metadata = {
  title: zadanie7Title('Тренажёр'),
};

/**
 * Вкладка «Тренажёр» №7. Сервер отдаёт названия типов и каталог ключей
 * задач; условия тренажёр загружает сам (public/data/zadanie7, без
 * ответов), разбор строит решатель в браузере.
 */
export default function Trenazher7Page() {
  return <Trenazher7Tab base={TRENAZHER7_HREF} />;
}
