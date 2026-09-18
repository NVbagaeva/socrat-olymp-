import type { Metadata } from 'next';
import { VeroyatnostPrep } from '@/components/tasks/veroyatnost/VeroyatnostPrep';
import { veroyatnostTitle } from '@/content/veroyatnost';
import { prep5Pool } from '@/lib/veroyatnost/pool';

export const metadata: Metadata = {
  title: veroyatnostTitle('5', 'Подготовительные задачи'),
};

/**
 * Вкладка «Подготовительные задачи» задания №5.
 *
 * Задачи 19–62 авторского конспекта в шести блоках. Номеров 51–54 в
 * конспекте нет, поэтому задач сорок, а не сорок четыре.
 */
export default function Podgotovka5Tab() {
  return <VeroyatnostPrep bloki={prep5Pool()} />;
}
