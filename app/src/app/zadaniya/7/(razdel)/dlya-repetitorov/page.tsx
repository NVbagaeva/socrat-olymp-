import { RedirectPage, REDIRECT_METADATA } from '@/components/layout';
import { ZADANIYA, href } from '@/lib/paths';

/* Вкладки «Для репетиторов» у №7 нет: материалов для неё не было
   (стояла заглушка). Листы ученика и учителя собирает «Генератор» —
   со старого адреса переход туда. Сервер отвечает 301 раньше
   (public/.htaccess). */
export const metadata = REDIRECT_METADATA;

export default function Page() {
  return <RedirectPage href={href(ZADANIYA, 7, 'generator')} title="Генератор" />;
}
