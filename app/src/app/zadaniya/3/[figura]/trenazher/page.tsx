import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { EmptyState } from '@/components/ui';
import { RAZDELY, razdelBySlug } from '@/lib/zadanie3';

export function generateStaticParams() {
  return RAZDELY.map((razdel) => ({ figura: razdel.slug }));
}
export const dynamicParams = false;

type Params = Promise<{ figura: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const razdel = razdelBySlug((await params).figura);
  return razdel === undefined
    ? {}
    : { title: `${razdel.nazvanie}. Тренажёр — задание №3 — Будет на ЕГЭ` };
}

/**
 * Вкладка «Тренажёр». Банк раздела уже собран и проверен, но экран
 * решения — отдельный этап: здесь будут выбор типа заданий, условие,
 * чертёж, поле ответа и разбор.
 */
export default async function TrenazherTab({ params }: { params: Params }) {
  const razdel = razdelBySlug((await params).figura);
  if (razdel === undefined) {
    notFound();
  }
  const variants = razdel.prototipy.reduce((sum, p) => sum + p.varianty.length, 0);
  return (
    <EmptyState
      title="Тренажёр готовится"
      description={`Банк раздела собран: ${razdel.prototipy.length} прототипов, ${variants} вариантов. Экран решения появится здесь.`}
    />
  );
}
