import type { Metadata } from 'next';
import { Trenazher10Tab } from '@/components/tasks/zadanie10/Trenazher10Tab';
import { zadanie10Title } from '@/content/zadanie10';
import { TRENAZHER10_HREF } from '@/lib/zadanie10/links';

export const metadata: Metadata = {
  title: zadanie10Title('Тренажёр'),
};

/**
 * Вкладка «Тренажёр» №10. Сервер отдаёт названия типов, каталог ключей
 * задач и найденные картинки сюжетов; условия тренажёр загружает сам
 * (public/data/zadanie10, без ответов), разбор строит решатель в браузере.
 */
export default function Trenazher10Page() {
  return <Trenazher10Tab base={TRENAZHER10_HREF} />;
}
