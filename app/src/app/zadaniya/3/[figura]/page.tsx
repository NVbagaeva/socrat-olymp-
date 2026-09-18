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
    : { title: `${razdel.nazvanie}. Теория — задание №3 — Будет на ЕГЭ` };
}

/**
 * Вкладка «Теория». Содержимое — следующий этап: первый блок каждого
 * раздела соберётся из шпаргалки, остальные останутся пустыми, пока
 * автор не напишет текст. Придумывать теорию здесь нечего и нельзя.
 */
export default async function TeoriyaTab({ params }: { params: Params }) {
  if (razdelBySlug((await params).figura) === undefined) {
    notFound();
  }
  return (
    <EmptyState
      title="Материал готовится"
      description="Здесь появятся «Что нужно помнить», элементы фигуры, формулы объёма и площади поверхности."
    />
  );
}
