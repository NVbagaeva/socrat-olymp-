import type { Metadata } from 'next';
import { Suspense } from 'react';
import { TrenazherSbornika } from '@/components/sbornik/Trenazher';
import { TIPY, sbornikTitle } from '@/content/sbornik';
import { zadachiGlavy } from '@/lib/sbornik/bank';
import { nomerGlavy, staticGlavy } from '@/lib/sbornik/marshrut';

export const dynamicParams = false;

export function generateStaticParams(): { glava: string }[] {
  return staticGlavy();
}

export async function generateMetadata({ params }: { params: Promise<{ glava: string }> }): Promise<Metadata> {
  const { glava } = await params;
  return { title: sbornikTitle('Тренажёр', `Глава ${nomerGlavy(glava)}`) };
}

/** Тренажёр главы: тексты задач грузятся файлами типов по мере решения. */
export default async function TrenazherGlavy({ params }: { params: Promise<{ glava: string }> }) {
  const { glava } = await params;
  const n = nomerGlavy(glava);
  const tipy = (TIPY[n] ?? []).map((t) => ({ id: t.id, nazvanie: t.nazvanie }));
  const bank = zadachiGlavy(n).map((z) => ({ id: z.id, tip: z.tip, uroven: z.uroven }));
  return (
    <Suspense fallback={null}>
      <TrenazherSbornika glava={n} tipy={tipy} bank={bank} />
    </Suspense>
  );
}
