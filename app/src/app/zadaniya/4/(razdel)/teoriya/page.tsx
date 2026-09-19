import type { Metadata } from 'next';
import { Teoriya4 } from '@/components/tasks/veroyatnost/Teoriya4';
import { veroyatnostTitle } from '@/content/veroyatnost';

export const metadata: Metadata = {
  title: veroyatnostTitle('4', 'Теория'),
};

/**
 * Вкладка «Теория» задания №4.
 *
 * Разделы идут подряд на одной странице, содержание — рядом.
 * Написан раздел «03. Координатная прямая»; остальные стоят в
 * содержании с пометкой «готовится»: придуманного здесь не будет.
 */
export default function Teoriya4Tab() {
  return <Teoriya4 />;
}
