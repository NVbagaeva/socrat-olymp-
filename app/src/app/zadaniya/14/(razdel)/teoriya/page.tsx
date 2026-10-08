import type { Metadata } from 'next';
import { Gotovitsya14 } from '@/components/tasks/zadanie14/Gotovitsya14';
import { zadanie14Title } from '@/content/zadanie14';

export const metadata: Metadata = {
  title: zadanie14Title('Теория'),
};

/** Вкладка «Теория» задания №14: материал готовится. */
export default function Teoriya14Tab() {
  return <Gotovitsya14 tab="teoriya" />;
}
