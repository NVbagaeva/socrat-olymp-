import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { findSubtopic, trainerSubtopicParams, SEKCIYA_GRAFIKOV } from '@/content/sections';
import content from '@/content/sheet12.js';
import { SheetPage } from '../SheetPage';
import 'katex/dist/katex.min.css';
import '@/lib/graph/graph.css';
import '@/lib/sheet/theme.css';
import '@/lib/sheet/sheet.css';
import '../pechat.css';

export function generateStaticParams() {
  return trainerSubtopicParams().map(({ task: _task, ...p }) => p);
}
export const dynamicParams = false;

type Params = Promise<{ type: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { type } = await params;
  const task = SEKCIYA_GRAFIKOV;
  const subtopic = findSubtopic(task, type);
  return subtopic
    ? {
        title: `${content.vse} · ${subtopic.title} — Будет на ЕГЭ`,
        robots: { index: false },
      }
    : {};
}

/**
 * «Всё одним файлом» генератора: листы ученика всех вариантов, затем
 * листы учителя с построениями и ответы — те же задачи по тому же адресу.
 */
export default async function Page({ params }: { params: Params }) {
  const { type } = await params;
  const task = SEKCIYA_GRAFIKOV;
  const subtopic = findSubtopic(task, type);
  if (!subtopic) {
    notFound();
  }
  return (
    <Suspense fallback={null}>
      <SheetPage withAnswers vse subtopic={subtopic.title} />
    </Suspense>
  );
}
