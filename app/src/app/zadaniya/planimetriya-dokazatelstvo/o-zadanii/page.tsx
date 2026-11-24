import { RedirectPage, REDIRECT_METADATA } from '@/components/layout';
import { razdelBase } from '@/lib/paths';

export const metadata = REDIRECT_METADATA;

/** Прежний адрес «О задании» №18: вкладка переехала на адрес раздела. */
export default function Page() {
  return <RedirectPage href={`${razdelBase(18)}/`} title="О задании" />;
}
