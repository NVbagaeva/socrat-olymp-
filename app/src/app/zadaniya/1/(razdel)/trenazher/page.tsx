import type { Metadata } from 'next';
import { Trenazher1Tab } from '@/components/tasks/planimetriya/Trenazher1Tab';
import { TRENAZHER1 } from '@/content/planimetriya1';
import { zadanie1Title } from '@/content/zadanie1';
import { TRENAZHER1_HREF } from '@/lib/planimetriya/trening/links';

export const metadata: Metadata = {
  title: zadanie1Title(TRENAZHER1.title),
};

/**
 * Вкладка «Тренажёр» №1 — общий тренажёр по банку задач. Сервер отдаёт
 * названия типов и каталог ключей задач; задачу по ключу (условие,
 * чертёж, разбор, подсказки) строит движок планиметрии в браузере.
 */
export default function Trenazher1Page() {
  return <Trenazher1Tab base={TRENAZHER1_HREF} />;
}
