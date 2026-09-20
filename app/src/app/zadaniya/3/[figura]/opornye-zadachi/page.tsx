import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { EmptyState } from '@/components/ui';
import { OPORNYE } from '@/content/opornye';
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
    : { title: `${razdel.nazvanie}. ${OPORNYE.title} — задание №3 — Будет на ЕГЭ` };
}

/**
 * Вкладка «Опорные задачи». Навыки раздела придумывать
 * нельзя: их список утверждает автор. Пока списка нет — вкладка
 * честно об этом говорит.
 */
export default async function OpornyeTab({ params }: { params: Params }) {
  if (razdelBySlug((await params).figura) === undefined) {
    notFound();
  }
  return (
    <EmptyState
      title="Материал готовится"
      description="Здесь появятся карточки навыков раздела с задачами на отработку."
    />
  );
}
