import { notFound } from 'next/navigation';
import { VeroyatnostShell } from '@/components/tasks/veroyatnost/VeroyatnostShell';
import { veroyatnostBySlug } from '@/content/veroyatnost';
import '../zadaniya.css';
import '../[task]/section.css';
import '../veroyatnost.css';

/**
 * Оболочка задания №4: крошки, заголовок и лента вкладок.
 *
 * Разметка общая с заданием №5 и живёт в VeroyatnostShell — здесь
 * только выбор раздела по адресу.
 */
export default function Veroyatnost4Layout({ children }: { children: React.ReactNode }) {
  const section = veroyatnostBySlug('4');
  if (section === undefined) {
    notFound();
  }
  return <VeroyatnostShell section={section}>{children}</VeroyatnostShell>;
}
