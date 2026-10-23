import type { Metadata } from 'next';
import { ProverkaAnalogov } from '@/components/tasks/zadanie11/ProverkaAnalogov';
import { dannyeProverki } from '@/lib/zadanie11/proverka';
import 'katex/dist/katex.min.css';
import './proverka.css';
import '../procenty.css';

export const metadata: Metadata = {
  title: 'Проверка аналогов · Задание 11 — Будет на ЕГЭ',
  robots: { index: false, follow: false },
};

/**
 * Служебная страница вычитки пула аналогов задания №11 — только для
 * преподавателя: noindex, в меню её нет. Ответы и решения показаны
 * намеренно, как у витрины /styleguide/.
 */
export default function ProverkaAnalogovPage() {
  return <ProverkaAnalogov razdely={dannyeProverki()} />;
}
