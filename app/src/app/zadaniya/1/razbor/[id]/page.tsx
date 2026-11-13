import { RedirectPage, REDIRECT_METADATA } from '@/components/layout';
import { O_ZADANII_1 } from '@/content/zadanie1';
import { gruppaHref1 } from '@/lib/planimetriya/trening/links';
import { texPlain } from '@/lib/tex';

/* Прежние страницы разборов №1 — по странице на группу типов (блок
   I–X). Разобранные примеры теперь раскрываются на вкладке «О задании»,
   в карточках типов: со старого адреса — переход на вкладку с якорем
   группы (якорь раскрывает группу и её первый тип,
   components/tasks/karta/YakorTipa.tsx). Сервер отвечает 301 раньше
   (public/.htaccess). */
export function generateStaticParams() {
  return O_ZADANII_1.tipy.map((t) => ({ id: t.id }));
}
export const dynamicParams = false;

export const metadata = REDIRECT_METADATA;

type Params = Promise<{ id: string }>;

/** Разбор группы → карточка группы на вкладке «О задании». */
export default async function Page({ params }: { params: Params }) {
  const { id } = await params;
  const tip = O_ZADANII_1.tipy.find((t) => t.id === id);
  return <RedirectPage href={gruppaHref1(tip?.blok ?? 'I')} title={texPlain(tip?.title ?? '')} />;
}
