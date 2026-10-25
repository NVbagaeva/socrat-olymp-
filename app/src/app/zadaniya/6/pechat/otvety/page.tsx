import type { Metadata } from 'next';
import { List6 } from '@/components/tasks/zadanie6/List6';
import { zadanie6Title } from '@/content/zadanie6';
import 'katex/dist/katex.min.css';
import '@/components/generator/shapka-banka.css';
import '@/components/probability/probability.css';
import '@/components/tasks/zadanie6/zadanie6.css';
import '../../zadanie6.css';
import '../pechat6.css';

export const metadata: Metadata = {
  title: zadanie6Title('Лист учителя'),
  robots: { index: false, follow: false },
};

/** Лист учителя №6: те же задачи, ответы и разбор по шагам. */
export default function Pechat6Otvety() {
  return <List6 vid="uchitel" />;
}
