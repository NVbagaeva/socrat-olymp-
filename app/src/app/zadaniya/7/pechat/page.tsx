import type { Metadata } from 'next';
import { List7 } from '@/components/tasks/zadanie7/List7';
import { zadanie7Title } from '@/content/zadanie7';
import 'katex/dist/katex.min.css';
import '@/components/generator/shapka-banka.css';
import '@/components/tasks/zadanie7/razbor7.css';
import '../zadanie7.css';
import './pechat7.css';

export const metadata: Metadata = {
  title: zadanie7Title('Лист ученика'),
  robots: { index: false, follow: false },
};

/**
 * Лист ученика №7: только условия и поле для ответа. Задачи — по
 * запросу в адресе (генератор) или коду урока; лист учителя
 * (/pechat/otvety/) с тем же адресом даёт те же задачи.
 */
export default function Pechat7() {
  return <List7 vid="uchenik" />;
}
