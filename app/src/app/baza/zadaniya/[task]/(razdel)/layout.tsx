import { ShellBaza } from '@/components/baza/ShellBaza';
import { bazaStaticParams, bazaTask, type BazaParams } from '@/components/baza/stranitsa';
import 'katex/dist/katex.min.css';
import '@/app/zadaniya/zadaniya.css';
import '@/app/zadaniya/[task]/section.css';
import '@/components/baza/baza.css';

export const generateStaticParams = bazaStaticParams;
export const dynamicParams = false;

/**
 * Оболочка задания базы: одна на все 21 задание и все вкладки.
 * Группа маршрутов (razdel) — вкладки раздела, как у заданий профиля.
 */
export default async function BazaZadanieLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: BazaParams;
}) {
  return <ShellBaza task={bazaTask((await params).task)}>{children}</ShellBaza>;
}
