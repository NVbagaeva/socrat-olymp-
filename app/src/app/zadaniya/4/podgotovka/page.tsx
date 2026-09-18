import type { Metadata } from 'next';
import { VeroyatnostPrep } from '@/components/tasks/veroyatnost/VeroyatnostPrep';
import { veroyatnostTitle } from '@/content/veroyatnost';
import { prep4Pool } from '@/lib/veroyatnost/pool';

export const metadata: Metadata = {
  title: veroyatnostTitle('4', 'Подготовительные задачи'),
};

/**
 * Вкладка «Подготовительные задачи» задания №4.
 *
 * Задачи 1–18 авторского конспекта, разложенные по его же трём
 * заголовкам. Условия перенесены дословно; ответы уезжают вниз
 * отпечатками, разборы закрытыми.
 */
export default function Podgotovka4Tab() {
  return <VeroyatnostPrep bloki={prep4Pool()} />;
}
