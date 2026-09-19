import type { Metadata } from 'next';
import { VeroyatnostTrainer } from '@/components/tasks/veroyatnost/VeroyatnostTrainer';
import { veroyatnostTitle } from '@/content/veroyatnost';
import { bank4Pool } from '@/lib/veroyatnost/pool';

export const metadata: Metadata = {
  title: veroyatnostTitle('4', 'Тренажёр'),
};

/**
 * Вкладка «Тренажёр» задания №4.
 *
 * Банк собирается на сборке: 23 прототипа по 10 вариантов. Вниз
 * уезжают только условия, отпечатки ответов и закрытые разборы —
 * формулы ответа и перебор исходов остаются здесь.
 */
export default function Trenazher4Tab() {
  return <VeroyatnostTrainer pool={bank4Pool()} roundKey="v4" />;
}
