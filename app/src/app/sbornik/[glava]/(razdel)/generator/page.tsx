import type { Metadata } from 'next';
import { GeneratorListov } from '@/components/sbornik/GeneratorListov';
import { TIPY, sbornikTitle } from '@/content/sbornik';
import { href, SBORNIK, SBORNIK_TAIL } from '@/lib/paths';
import { zadachiTipa } from '@/lib/sbornik/bank';
import { nomerGlavy, staticGlavy } from '@/lib/sbornik/marshrut';
import '@/components/tasks/space/space-option.css';

export const dynamicParams = false;

export function generateStaticParams(): { glava: string }[] {
  return staticGlavy();
}

export async function generateMetadata({ params }: { params: Promise<{ glava: string }> }): Promise<Metadata> {
  const { glava } = await params;
  return { title: sbornikTitle('Генератор листов', `Глава ${nomerGlavy(glava)}`) };
}

/** Генератор листов главы: варианты, лист учителя с решениями, клетка или без. */
export default async function GeneratorGlavy({ params }: { params: Promise<{ glava: string }> }) {
  const { glava } = await params;
  const n = nomerGlavy(glava);
  const tipy = (TIPY[n] ?? []).map((t) => {
    const z = zadachiTipa(t.id);
    const po = (u: number) => z.filter((item) => item.uroven === u).length;
    return { id: t.id, nazvanie: t.nazvanie, poUrovnyam: [po(1), po(2), po(3)] as const };
  });
  return <GeneratorListov glava={n} tipy={tipy} pechatHref={href(SBORNIK, glava, SBORNIK_TAIL.pechat)} />;
}
