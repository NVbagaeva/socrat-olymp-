import { RedirectPage, REDIRECT_METADATA } from '@/components/layout';
import { TIPY3, TIPY3_ORDER } from '@/content/zadanie3/gruppy';
import { tipHref3 } from '@/lib/zadanie3/links';
import { texPlain } from '@/lib/tex';

/* Прежние страницы разборов №3 — по странице на тип. Разобранный
   пример теперь раскрывается на вкладке «О задании», в карточке типа:
   со старого адреса — переход на вкладку с якорем типа (якорь
   раскрывает карточку, components/tasks/zadanie3/YakorTipa.tsx).
   Сервер отвечает 301 раньше (public/.htaccess). */
export function generateStaticParams() {
  return TIPY3_ORDER.map((tip) => ({ tip }));
}
export const dynamicParams = false;

export const metadata = REDIRECT_METADATA;

type Params = Promise<{ tip: string }>;

/** Разбор типа → карточка этого типа на вкладке «О задании». */
export default async function Page({ params }: { params: Params }) {
  const { tip } = await params;
  return <RedirectPage href={tipHref3(tip)} title={texPlain(TIPY3[tip]?.nazvanie ?? '')} />;
}
