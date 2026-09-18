import type { Metadata } from 'next';
import { VeroyatnostTrainer } from '@/components/tasks/veroyatnost/VeroyatnostTrainer';
import { veroyatnostTitle } from '@/content/veroyatnost';
import { bank5Pool } from '@/lib/veroyatnost/pool';

export const metadata: Metadata = {
  title: veroyatnostTitle('5', 'Тренажёр'),
};

/**
 * Вкладка «Тренажёр» задания №5.
 *
 * Пятнадцать прототипов по десять вариантов, одиннадцать чипов —
 * по одному на способ решения. Вниз уезжают только условия,
 * отпечатки ответов и закрытые разборы.
 */
export default function Trenazher5Tab() {
  return <VeroyatnostTrainer pool={bank5Pool()} roundKey="v5" />;
}
