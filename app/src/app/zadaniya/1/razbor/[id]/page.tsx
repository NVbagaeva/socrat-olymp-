import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { RazborTipa1 } from '@/components/tasks/planimetriya/RazborTipa1';
import { O_ZADANII_1, ZADANIE1 } from '@/content/zadanie1';
import { ZADANIYA } from '@/lib/paths';
import 'katex/dist/katex.min.css';
import '../../../zadaniya.css';
import '../../../[task]/section.css';
import '../../../[task]/[type]/topic.css';
import '@/lib/planimetriya/planimetriya.css';
import '../../zadanie1.css';
import { metaPodstranitsy } from '@/content/seo';
import { tekstBezTex } from '@/lib/tekstFormul';

/* Разбор типа задач со вкладки «О задании»: вкладка подгружает эту
   страницу по клику на плашку и вставляет из неё блок разбора; без
   скриптов на неё ведёт обычная ссылка с плашки. */
export function generateStaticParams() {
  return O_ZADANII_1.tipy.map((t) => ({ id: t.id }));
}
export const dynamicParams = false;

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const tip = O_ZADANII_1.tipy.find((t) => t.id === id);
  return tip ? metaPodstranitsy(1, 'razbor', tekstBezTex(tip.title)) : {};
}

export default async function Razbor1Page({ params }: { params: Params }) {
  const { id } = await params;
  const tip = O_ZADANII_1.tipy.find((t) => t.id === id);
  if (tip === undefined) {
    notFound();
  }
  return (
    <AppShell active="tasks">
      <RazborTipa1 tip={tip} base={`${ZADANIYA}/${ZADANIE1.slug}`} />
    </AppShell>
  );
}
