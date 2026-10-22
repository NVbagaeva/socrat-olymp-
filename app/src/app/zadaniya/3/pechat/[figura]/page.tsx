import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { SheetPage3 } from '@/components/tasks/solid3/SheetPage3';
import { SHEET_3 } from '@/content/sheet3';
import { RAZDELY, razdelBySlug } from '@/lib/zadanie3';
import { estScenariy } from '@/lib/zadanie3/chertezhi';
import { dannyePechati } from '@/lib/zadanie3/pechat-dannye';
import 'katex/dist/katex.min.css';
import '@/lib/sheet/theme.css';
import '@/lib/sheet/sheet.css';
import '../pechat3.css';

/** Печать есть у разделов с многогранниками: их чертежи — сценарии. */
export function generateStaticParams() {
  return RAZDELY.filter((r) => r.prototipy.some(estScenariy)).map((r) => ({ figura: r.slug }));
}
export const dynamicParams = false;

export const metadata: Metadata = {
  title: `${SHEET_3.uchenik} · Задание №3 — Будет на ЕГЭ`,
  robots: { index: false },
};

type Params = Promise<{ figura: string }>;

/** Лист ученика: условия, чертежи без построений, строка ответа. */
export default async function Pechat3Page({ params }: { params: Params }) {
  const razdel = razdelBySlug((await params).figura);
  if (razdel === undefined) notFound();
  return (
    <Suspense fallback={null}>
      <SheetPage3 vid="uchenik" razdel={razdel.nazvanie} zadachi={dannyePechati(razdel)} />
    </Suspense>
  );
}
