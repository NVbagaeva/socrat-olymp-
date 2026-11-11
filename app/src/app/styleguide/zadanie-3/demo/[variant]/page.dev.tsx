import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Demo3 } from '../Demo3';
import { VARIANTY3 } from '../demo3Data';
import 'katex/dist/katex.min.css';
import '@/lib/solid/solid.css';
import '@/components/stereo/stereo.css';
import '@/components/stereo/metodika.css';
import '../demo3.css';

/* Демо оформления вкладок «О задании», «Опорные задачи» и «Тренажёр»
   задания №3 — только для разработки.

   Файл называется page.dev.tsx: страницей он становится лишь в
   `next dev` или со флагом GALEREYA=1 (next.config.ts). В обычной
   сборке маршрута нет — адрес отдаёт 404, это проверяет
   scripts/check-dev-pages.mjs. В меню сайта страница не входит. */

export const metadata: Metadata = {
  title: 'Демо оформления задания №3',
  robots: { index: false, follow: false },
};

export function generateStaticParams() {
  return VARIANTY3.map((item) => ({ variant: item.id }));
}

export const dynamicParams = false;

export default async function Demo3Page({ params }: { params: Promise<{ variant: string }> }) {
  const { variant } = await params;
  const found = VARIANTY3.find((item) => item.id === variant);
  if (found === undefined) {
    notFound();
  }
  return <Demo3 v={found.id} />;
}
