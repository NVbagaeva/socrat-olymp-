import type { Metadata } from 'next';
import { Trenazher11Tab } from '@/components/tasks/zadanie11/Trenazher11Tab';
import { TRENAZHER11 } from '@/content/tekstovye11';
import { zadanie11Title } from '@/content/zadanie11';
import { TRENAZHER11_HREF } from '@/lib/zadanie11/links';

export const metadata: Metadata = {
  title: zadanie11Title(TRENAZHER11.title),
};

/**
 * Вкладка «Тренажёр» №11. Сервер отдаёт названия типов и каталог ключей
 * задач; условия тренажёр загружает сам (public/data/zadanie11, без
 * ответов), разбор, таблицу модели и подсказки строит решатель в браузере.
 */
export default function Trenazher11Page() {
  return <Trenazher11Tab base={TRENAZHER11_HREF} />;
}
