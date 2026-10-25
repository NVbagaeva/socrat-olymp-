import type { Metadata } from 'next';
import { List10 } from '@/components/tasks/zadanie10/List10';
import { zadanie10Title } from '@/content/zadanie10';
import { kartinkiPrototipov } from '@/lib/zadanie10/illyustracii';
import 'katex/dist/katex.min.css';
import '@/components/generator/shapka-banka.css';
import '@/components/tasks/zadanie10/razbor10.css';
import '../zadanie10.css';
import './pechat10.css';

export const metadata: Metadata = {
  title: zadanie10Title('Лист'),
  robots: { index: false, follow: false },
};

/**
 * Печатный лист №10: лист ученика общего генератора (ps=2), прежний
 * адрес генератора (m=g) и урока (m=u) — у них вид листа в
 * l=uchenik|uchitel. Всё в адресе: ученик и учитель получают одни и те
 * же задачи.
 */
export default function Pechat10() {
  return <List10 ill={kartinkiPrototipov()} />;
}
