import { notFound } from 'next/navigation';
import { RedirectPage, REDIRECT_METADATA } from '@/components/layout';
import { chastiStarykh, novyyAdres } from '@/content/pereezd';
import { vseRazdely } from '@/content/tasks';

/* Прежние адреса внутри раздела по номеру (/zadaniya/7/teoriya/,
   /zadaniya/12/linear/trenazher/): «Страница переехала» на тот же
   адрес по коду раздела (content/pereezd). Сервер отвечает 301 раньше. */
export function generateStaticParams() {
  return chastiStarykh()
    .filter((ch) => ch.length > 1)
    .map(([task, ...hvost]) => ({ task: task!, hvost }));
}
export const dynamicParams = false;

export const metadata = REDIRECT_METADATA;

type Params = Promise<{ task: string; hvost: string[] }>;

export default async function StaryyAdres({ params }: { params: Params }) {
  const { task, hvost } = await params;
  const kuda = novyyAdres(`/zadaniya/${[task, ...hvost].join('/')}/`);
  if (kuda === undefined) notFound();
  const razdel = vseRazdely.find((r) => r.slug === task);
  return <RedirectPage href={kuda} title={razdel?.name ?? 'Банк заданий'} />;
}
