import type { Metadata } from 'next';
import { List7 } from '@/components/tasks/zadanie7/List7';
import { zadanie7Title } from '@/content/zadanie7';
import 'katex/dist/katex.min.css';
import '@/lib/sheet/theme.css';
import '@/lib/sheet/sheet.css';
import '@/app/zadaniya/[task]/[type]/pechat/pechat.css';
import '@/components/tasks/zadanie7/razbor7.css';
import '../../zadanie7.css';
import '../pechat7.css';

export const metadata: Metadata = {
  title: zadanie7Title('Лист учителя'),
  robots: { index: false, follow: false },
};

/** Лист учителя №7: те же задачи, ответы и разбор по шагам с ОДЗ и отбором корней. */
export default function Pechat7Otvety() {
  return <List7 vid="uchitel" />;
}
