import type { Metadata } from 'next';
import { UznayMetod } from '@/components/tasks/veroyatnost/UznayMetod';
import { veroyatnostTitle } from '@/content/veroyatnost';
import { uznayMetodPool } from '@/lib/veroyatnost/pool';

export const metadata: Metadata = {
  title: veroyatnostTitle('5', 'Узнай метод'),
};

/**
 * Вкладка «Узнай метод» задания №5: условие и шесть кнопок методов.
 *
 * В браузер уезжают только условия, отпечатки методов и закрытые
 * признаки: ни рисунков, ни разборов, ни ответов — по ним метод
 * читался бы без ученика.
 */
export default function UznayMetod5Tab() {
  return <UznayMetod pool={uznayMetodPool(5)} zadanie={5} />;
}
