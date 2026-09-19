import type { Metadata } from 'next';
import { Trenazher } from '@/components/tasks/veroyatnost/Trenazher';
import { veroyatnostTitle } from '@/content/veroyatnost';
import { bank4Pool } from '@/lib/veroyatnost/pool';

export const metadata: Metadata = {
  title: veroyatnostTitle('4', 'Тренажёр'),
};

/**
 * Вкладка «Тренажёр» задания №4 — раздел 07 референса: три режима на
 * карточке ProblemCard, прогресс отдельно по каждому методу.
 *
 * Банк собирается на сборке: 21 прототип, у каждого варианты
 * задачника и десять сгенерированных. Вниз уезжают условия, открытые
 * параметры рисунка, отпечатки ответов и закрытые разборы — формулы
 * ответа и перебор исходов остаются здесь.
 */
export default function Trenazher4Tab() {
  return <Trenazher pool={bank4Pool()} zadanie={4} />;
}
