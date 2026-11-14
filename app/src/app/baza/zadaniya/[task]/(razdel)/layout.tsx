import { ShellBaza } from '@/components/baza/ShellBaza';
import { bazaStaticParams, bazaTask, type BazaParams } from '@/components/baza/stranitsa';
import 'katex/dist/katex.min.css';
import '@/app/zadaniya/zadaniya.css';
import '@/app/zadaniya/[task]/section.css';
/* Лента, тренажёр, опорные задачи, карточки — те же стили, что у
   разделов профиля с тренажёром по банку (№6): своих копий нет. */
import '@/app/zadaniya/[task]/[type]/topic.css';
import '@/app/zadaniya/[task]/[type]/trainer.css';
import '@/app/zadaniya/[task]/[type]/prep.css';
import '@/app/zadaniya/veroyatnost.css';
import '@/app/zadaniya/komplekt.css';
import '@/components/probability/probability.css';
import '@/components/tasks/zadanie6/zadanie6.css';
import '@/app/zadaniya/6/zadanie6.css';
import '@/components/kartochki/kartochki.css';
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
