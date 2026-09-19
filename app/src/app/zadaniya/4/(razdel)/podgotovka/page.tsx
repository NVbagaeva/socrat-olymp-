import type { Metadata } from 'next';
import { Podgotovka4 } from '@/components/tasks/veroyatnost/Podgotovka4';
import { veroyatnostTitle } from '@/content/veroyatnost';
import { prep4Pool } from '@/lib/veroyatnost/pool';

export const metadata: Metadata = {
  title: veroyatnostTitle('4', 'Подготовительные задачи'),
};

/**
 * Вкладка «Подготовительные задачи» задания №4.
 *
 * Задачи 1–18 авторского конспекта, разложенные по его же трём
 * заголовкам, на карточке ProblemCard. Условия перенесены дословно;
 * ответы уезжают вниз отпечатками, разборы закрытыми.
 */
export default function Podgotovka4Tab() {
  return <Podgotovka4 bloki={prep4Pool()} />;
}
