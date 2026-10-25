import Link from 'next/link';
import { clsx } from 'clsx';
import { POV_HREF, POV_SCREEN } from '@/content/povyshennye';
import '@/components/variant/variant-entry.css';

/**
 * Плашка-вход «Варианты повышенной сложности»: рядом с плашкой «Собрать
 * вариант» на главной и над сеткой банка. Стиль — тот же «голубое стекло».
 */
export function PovEntry({ className }: { className?: string }) {
  const T = POV_SCREEN.entry;
  return (
    <Link className={clsx('var-entry', className)} href={POV_HREF}>
      <span className="var-entry__ico" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M8.5 3.5h8.2l3.3 3.3v10.7a1 1 0 0 1-1 1h-10.5a1 1 0 0 1-1-1v-13a1 1 0 0 1 1-1z" />
          <path d="M5.5 7v12.5a1 1 0 0 0 1 1h9" />
          <path d="m13.3 8.2 1 2 2.2.3-1.6 1.6.4 2.2-2-1-2 1 .4-2.2-1.6-1.6 2.2-.3z" />
        </svg>
      </span>
      <span className="var-entry__text">
        <span className="var-entry__title">{T.title}</span>
        <span className="var-entry__note">{T.note}</span>
      </span>
      <span className="var-entry__arrow" aria-hidden="true">
        →
      </span>
    </Link>
  );
}
