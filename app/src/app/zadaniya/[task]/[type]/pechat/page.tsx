import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { findSubtopic, trainerSubtopicParams } from '@/content/sections';
import { generatorPage } from '@/content/generator';
import { SheetPage } from './SheetPage';
import 'katex/dist/katex.min.css';
import '@/lib/graph/graph.css';
import '@/lib/sheet/theme.css';
import '@/lib/sheet/sheet.css';
import './pechat.css';

/* Страница печати есть только у подтем с наборами прототипов: лист
   собирает генератор, а он идёт по тем же наборам, что тренажёр. */
export function generateStaticParams() {
  return trainerSubtopicParams();
}
export const dynamicParams = false;

type Params = Promise<{ task: string; type: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { task, type } = await params;
  const subtopic = findSubtopic(task, type);
  return subtopic ? { title: `${generatorPage.student} · ${subtopic.title} — Будет на ЕГЭ`, robots: { index: false } } : {};
}

/**
 * Лист для ученика: задачи со строкой «Ответ: ____», без ответов.
 * Параметры варианта — в адресе; оболочки сайта нет, только лист.
 */
export default async function Page({ params }: { params: Params }) {
  const { task, type } = await params;
  if (!findSubtopic(task, type)) {
    notFound();
  }
  return (
    /* useSearchParams требует границы ожидания: без неё статический
       экспорт страницы не собирается. */
    <Suspense fallback={null}>
      <SheetPage withAnswers={false} />
    </Suspense>
  );
}
