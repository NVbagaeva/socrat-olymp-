import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Demo8 } from '../Demo8';
import { VARIANTY8 } from '../demo8Data';
import 'katex/dist/katex.min.css';
import '../demo8.css';

/* Демо оформления вкладок «О задании» и «Тренажёр» задания №8 —
   только для разработки.

   Файл называется page.dev.tsx: страницей он становится лишь в
   `next dev` или со флагом GALEREYA=1 (next.config.ts). В обычной
   сборке маршрута нет — адрес отдаёт 404, это проверяет
   scripts/check-dev-pages.mjs. В меню сайта страница не входит. */

export const metadata: Metadata = {
  title: 'Демо оформления задания №8',
  robots: { index: false, follow: false },
};

export function generateStaticParams() {
  return VARIANTY8.map((item) => ({ variant: item.id }));
}

export const dynamicParams = false;

export default async function Demo8Page({ params }: { params: Promise<{ variant: string }> }) {
  const { variant } = await params;
  const found = VARIANTY8.find((item) => item.id === variant);
  if (found === undefined) {
    notFound();
  }
  return <Demo8 v={found.id} />;
}
