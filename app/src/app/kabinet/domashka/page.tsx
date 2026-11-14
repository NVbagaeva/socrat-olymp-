import type { Metadata } from 'next';
import { AuthDisabled } from '@/components/auth/AuthDisabled';
import { AuthShell } from '@/components/auth/AuthShell';
import { HomeworkScreen } from '@/components/dz/HomeworkScreen';
import { AUTH_ENABLED } from '@/lib/auth/config';
import 'katex/dist/katex.min.css';
/* Рисунки условий разделов в ДЗ: №6 (диаграммы, деревья, таблицы), №10 (мост). */
import '@/components/probability/probability.css';
import '@/components/tasks/zadanie6/zadanie6.css';
import '@/components/tasks/zadanie10/razbor10.css';
/* №1: чертежи планиметрии. */
import '@/lib/planimetriya/planimetriya.css';
/* №3–№5: чертежи стереометрии, плоские чертежи, иллюстрации. */
import '@/components/dz/risunki-dz.css';
/* №13: таблицы условия и решения. */
import '@/app/zadaniya/13/reshenie13.css';

export const metadata: Metadata = {
  title: 'Домашнее задание — Будет на ЕГЭ',
  robots: { index: false },
};

/** Домашнее задание: ученику — решение, репетитору — результаты. ДЗ — в ?id=. */
export default function DomashkaPage() {
  if (!AUTH_ENABLED) return <AuthDisabled />;
  return (
    <AuthShell wide>
      <HomeworkScreen />
    </AuthShell>
  );
}
