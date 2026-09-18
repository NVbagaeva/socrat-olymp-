import { notFound } from 'next/navigation';
import { VeroyatnostShell } from '@/components/tasks/veroyatnost/VeroyatnostShell';
import { veroyatnostBySlug } from '@/content/veroyatnost';
import '../zadaniya.css';
import '../[task]/section.css';
import '../veroyatnost.css';

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
