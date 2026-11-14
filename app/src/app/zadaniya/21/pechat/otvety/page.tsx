import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SheetPage21 } from '@/components/tasks/zadanie21/SheetPage21';
import { generatorPage } from '@/content/generator';
import { zadanie21Title } from '@/content/zadanie21';
import 'katex/dist/katex.min.css';
import '@/lib/sheet/theme.css';
import '@/lib/sheet/sheet.css';
import '../pechat21.css';

export const metadata: Metadata = {
  title: `${generatorPage.teacher} · ${zadanie21Title('Генератор')}`,
  robots: { index: false },
};

/** Лист учителя: те же задачи по тому же адресу, разбор по шагам и таблица ответов. */
export default function Pechat21OtvetyPage() {
  return (
    <Suspense fallback={null}>
      <SheetPage21 vid="uchitel" />
    </Suspense>
  );
}
