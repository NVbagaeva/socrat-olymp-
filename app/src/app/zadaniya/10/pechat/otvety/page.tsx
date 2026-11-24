import type { Metadata } from 'next';
import { List10 } from '@/components/tasks/zadanie10/List10';
import { zadanie10Title } from '@/content/zadanie10';
import { kartinkiZadach10 } from '@/lib/zadanie10/kartinkiZadach10';
import 'katex/dist/katex.min.css';
import '@/lib/sheet/theme.css';
import '@/lib/sheet/sheet.css';
import '@/app/zadaniya/[task]/[type]/pechat/pechat.css';
import '@/components/tasks/zadanie10/razbor10.css';
import '../../zadanie10.css';
import '../pechat10.css';

export const metadata: Metadata = {
  title: zadanie10Title('Лист учителя'),
  robots: { index: false, follow: false },
};

/** Лист учителя №10: те же задачи, что у ученика по тому же адресу, с ответами и разбором. */
export default function Pechat10Otvety() {
  return <List10 ill={kartinkiZadach10()} vid="uchitel" />;
}
