import { typeset } from '@/lib/tex';

/**
 * Название типа задания в сводке тренажёра. В названиях бывают
 * формулы ($…$): их набирает KaTeX — он и так есть на экране
 * тренажёра, задания которого собираются в браузере.
 */
export function KindName({ title, className }: { title: string; className?: string }) {
  return (
    <span
      {...(className === undefined ? {} : { className })}
      dangerouslySetInnerHTML={{ __html: typeset(title) }}
    />
  );
}
