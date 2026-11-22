import type { Metadata } from 'next';
import { Trenazher6Tab } from '@/components/tasks/zadanie6/Trenazher6Tab';
import { zadanie6Title } from '@/content/zadanie6';
import { TRENAZHER6_HREF } from '@/lib/zadanie6/links';

export const metadata: Metadata = {
  title: zadanie6Title('Тренажёр'),
};

/**
 * Вкладка «Тренажёр» №6. Сервер отдаёт названия типов и каталог ключей
 * задач; условия тренажёр загружает сам (public/data/zadanie6, без
 * ответов), рисунок и разбор строит решатель в браузере.
 */
export default function Trenazher6Page() {
  return <Trenazher6Tab base={TRENAZHER6_HREF} />;
}
