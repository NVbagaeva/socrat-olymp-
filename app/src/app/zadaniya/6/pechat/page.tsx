import type { Metadata } from 'next';
import { List6 } from '@/components/tasks/zadanie6/List6';
import { zadanie6Title } from '@/content/zadanie6';
import 'katex/dist/katex.min.css';
import '@/components/probability/probability.css';
import '@/components/tasks/zadanie6/zadanie6.css';
import '../zadanie6.css';
import './pechat6.css';

export const metadata: Metadata = {
  title: zadanie6Title('Лист ученика'),
  robots: { index: false, follow: false },
};

/**
 * Лист ученика №6: условия с рисунками и поле для ответа. Задачи — по
 * запросу в адресе (генератор) или коду урока; лист учителя
 * (/pechat/otvety/) с тем же адресом даёт те же задачи.
 */
export default function Pechat6() {
  return <List6 vid="uchenik" />;
}
