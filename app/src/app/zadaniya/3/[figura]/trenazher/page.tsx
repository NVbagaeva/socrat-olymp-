import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Solid3Trainer } from '@/components/tasks/solid3/Solid3Trainer';
import { RAZDELY, razdelBySlug } from '@/lib/zadanie3';
import { razdelPool } from '@/lib/zadanie3/pool';
import { stereometria } from '@/content/stereometria';
import { href, ZADANIYA } from '@/lib/paths';
import { scopeOfPath } from '@/lib/trainerSession/scope';
import '../trenazher.css';

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
 * Вкладка «Тренажёр» раздела.
 *
 * Банк раздела собирается на сборке: условия набраны KaTeX, чертежи
 * нарисованы движком. Ответы уходят вниз только отпечатками, разборы
 * закрытыми — открытым текстом в разметке их нет.
 */
export default async function TrenazherTab({ params }: { params: Params }) {
  const razdel = razdelBySlug((await params).figura);
  if (razdel === undefined) {
    notFound();
  }
  /* Адрес раздела: по нему же лента вкладок узнаёт о незавершённой тренировке. */
  const base = href(ZADANIYA, stereometria.slug, razdel.slug);
  return (
    <Solid3Trainer
      pool={razdelPool(razdel)}
      scope={scopeOfPath(base) ?? razdel.slug}
      backHref={base}
    />
  );
}
