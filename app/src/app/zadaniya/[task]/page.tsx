import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { findSection, sectionParams } from '@/content/sections';
import '../zadaniya.css';

/* Статический экспорт: список страниц известен до сборки и считается
   из конфига. Незаявленные адреса не собираются и не открываются. */
export function generateStaticParams() {
  return sectionParams();
}
export const dynamicParams = false;

type Params = Promise<{ task: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const section = findSection((await params).task);
  if (!section) {
    return {};
  }
  return { title: `${section.title} — Будет на ЕГЭ`, description: section.description };
}

export default async function SectionPage({ params }: { params: Params }) {
  const section = findSection((await params).task);
  if (!section) {
    notFound();
  }

  return (
    <AppShell active="tasks">
      <main className="app-main">
        <h1 className="t-h1">{section.title}</h1>
      </main>
    </AppShell>
  );
}
