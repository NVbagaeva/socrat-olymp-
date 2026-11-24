import { RedirectPage, REDIRECT_METADATA } from '@/components/layout';
import { razdel } from '@/content/struktura';
import { href, ZADANIYA } from '@/lib/paths';

export const metadata = REDIRECT_METADATA;

/**
 * Прежний адрес раздела «Задача на оптимизацию» (номер хранения 17).
 * В ЕГЭ-2027 своего номера у него нет: задачи идут вторым видом
 * экономической задачи — вкладкой «На оптимизацию» её раздела
 * (content/struktura.js, vnutri). Заглушка — для старых ссылок и
 * закладок; сервер отвечает 301 раньше (public/.htaccess).
 */
export default function Page() {
  return (
    <RedirectPage
      href={href(ZADANIYA, String(razdel('ekonomika').hranenie), 'optimizaciya')}
      title="Задачи на оптимизацию"
    />
  );
}
