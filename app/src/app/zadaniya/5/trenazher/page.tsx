import type { Metadata } from 'next';
import { Trenazher } from '@/components/tasks/veroyatnost/Trenazher';
import { veroyatnostTitle } from '@/content/veroyatnost';
import { bank5Pool } from '@/lib/veroyatnost/pool';

export const metadata: Metadata = {
  title: veroyatnostTitle('5', 'Тренажёр'),
};

/**
 * Вкладка «Тренажёр» задания №5 — тот же тренажёр, что у задания №4:
 * три режима на карточке ProblemCard, прогресс по шести методам.
 *
 * Банк собирается на сборке: 12 прототипов, у каждого варианты
 * задачника и десять сгенерированных. Вниз уезжают условия, открытые
 * параметры рисунка, отпечатки ответов и закрытые разборы.
 */
export default function Trenazher5Tab() {
  return <Trenazher pool={bank5Pool()} zadanie={5} />;
}
