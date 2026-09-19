import { notFound } from 'next/navigation';
import { VeroyatnostShell } from '@/components/tasks/veroyatnost/VeroyatnostShell';
import { veroyatnostBySlug } from '@/content/veroyatnost';
import 'katex/dist/katex.min.css';
import '../zadaniya.css';
import '../[task]/section.css';
import '../veroyatnost.css';
import '@/components/probability/probability.css';
import '@/components/tasks/card/problem-card.css';
/* Стили тренажёра, «Узнай метод» и прогресса по методам общие с
   заданием №4 и живут в его файле. */
import '../4/zadanie4.css';

/**
 * Оболочка задания №5: крошки, заголовок и лента вкладок.
 *
 * Разметка общая с заданием №4 и живёт в VeroyatnostShell — здесь
 * только выбор раздела по адресу.
 */
export default function Veroyatnost5Layout({ children }: { children: React.ReactNode }) {
  const section = veroyatnostBySlug('5');
  if (section === undefined) {
    notFound();
  }
  return <VeroyatnostShell section={section}>{children}</VeroyatnostShell>;
}
