import type { Metadata } from 'next';
import { AuthDisabled } from '@/components/auth/AuthDisabled';
import { AuthShell } from '@/components/auth/AuthShell';
import { Konstruktor } from '@/components/dz/konstruktor/Konstruktor';
import { AUTH_ENABLED } from '@/lib/auth/config';
import 'katex/dist/katex.min.css';
/* Рисунки условий разделов в ДЗ: №6 (диаграммы, деревья, таблицы), №10 (мост). */
import '@/components/probability/probability.css';
import '@/components/tasks/zadanie6/zadanie6.css';
import '@/components/tasks/zadanie10/razbor10.css';
/* №1: чертежи планиметрии. */
import '@/lib/planimetriya/planimetriya.css';

export const metadata: Metadata = {
  title: 'Выдать домашнее задание — Будет на ЕГЭ',
  robots: { index: false },
};

/**
 * «Выдать домашнее задание» — конструктор ДЗ из карточек, опорных задач
 * и тренажёра (components/dz/konstruktor). Прежние ссылки с параметрами
 * (lib/dz/links.ts → issueHref) кладут типы и задачи в черновик.
 */
export default function VydatPage() {
  if (!AUTH_ENABLED) return <AuthDisabled />;
  return (
    <AuthShell wide>
      <Konstruktor />
    </AuthShell>
  );
}
