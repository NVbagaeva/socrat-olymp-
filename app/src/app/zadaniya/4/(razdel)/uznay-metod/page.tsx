import type { Metadata } from 'next';
import { UznayMetod } from '@/components/tasks/veroyatnost/UznayMetod';
import { veroyatnostTitle } from '@/content/veroyatnost';
import { uznayMetodPool } from '@/lib/veroyatnost/pool';

export const metadata: Metadata = {
  title: veroyatnostTitle('4', 'Узнай метод'),
};

/**
 * Вкладка «Узнай метод» задания №4: условие и пять кнопок методов.
 *
 * В браузер уезжают только условия, отпечатки методов и закрытые
 * признаки: ни рисунков, ни разборов, ни ответов — по ним метод
 * читался бы без ученика.
 */
export default function UznayMetod4Tab() {
  return <UznayMetod pool={uznayMetodPool()} />;
}
