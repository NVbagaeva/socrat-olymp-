import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Opornye11Screen } from '@/components/tasks/zadanie11/Opornye11Screen';
import { Opornye11Shell } from '@/components/tasks/zadanie11/Opornye11Shell';
import { OPORNYE } from '@/content/opornye';
import { tasksPage } from '@/content/tasks';
import { ZADANIE11, zadanie11Title } from '@/content/zadanie11';
import { BLOKI, blokBySlug } from '@/lib/zadanie11/prep/bloki';
import { prepPool11 } from '@/lib/zadanie11/prep/pool';

/* Статический экспорт: адреса блоков известны до сборки. */
export function generateStaticParams() {
  return BLOKI.map((b) => ({ blok: b.slug }));
}
export const dynamicParams = false;

type Params = Promise<{ blok: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { blok } = await params;
  const found = blokBySlug(blok);
  return { title: zadanie11Title(found === undefined ? OPORNYE.title : found.nazvanie) };
}

/**
 * Блок «Опорных задач» №11: десять микрозадач в закрытом виде. Пул
 * собран на сборке — в разметку уходят условия, таблицы с «?»,
 * отпечатки, закрытые подсказки и разборы.
 */
export default async function Opornye11BlokPage({ params }: { params: Params }) {
  const { blok } = await params;
  const found = prepPool11().find((item) => item.slug === blok);
  if (found === undefined) {
    notFound();
  }
  const listHref = `${tasksPage.href}/${ZADANIE11.slug}/${OPORNYE.tail}`;
  return (
    <Opornye11Shell
      listHref={listHref}
      totals={BLOKI.map((b) => ({ id: b.id, total: b.zadachi.length }))}
      vBloke
    >
      <Opornye11Screen
        blockId={found.id}
        razdel={found.razdel}
        title={found.nazvanie}
        tasks={found.zadachi}
        zapomniHtml={found.zapomniHtml}
        listHref={listHref}
      />
    </Opornye11Shell>
  );
}
