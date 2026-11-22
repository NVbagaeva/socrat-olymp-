import { RedirectPage, REDIRECT_METADATA } from '@/components/layout';
import { tipHref7 } from '@/lib/zadanie7/links';
import { PROTOTYPES } from '@/lib/zadanie7/prototypes';
import { texPlain } from '@/lib/tex';

/* Прежние страницы разборов №7 — по странице на прототип. Разобранный
   пример теперь раскрывается на вкладке «О задании», в карточке типа:
   со старого адреса — переход на вкладку с якорем типа (якорь
   раскрывает карточку, components/tasks/karta/YakorTipa.tsx). Сервер
   отвечает 301 раньше (public/.htaccess). */
export function generateStaticParams() {
  return PROTOTYPES.map((p) => ({ prototip: p.id }));
}
export const dynamicParams = false;

export const metadata = REDIRECT_METADATA;

type Params = Promise<{ prototip: string }>;

/** Разбор прототипа → карточка этого типа на вкладке «О задании». */
export default async function Page({ params }: { params: Params }) {
  const { prototip } = await params;
  const p = PROTOTYPES.find((x) => x.id === prototip);
  return <RedirectPage href={tipHref7(prototip)} title={texPlain(p?.title ?? '')} />;
}
