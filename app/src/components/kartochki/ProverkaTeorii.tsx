'use client';

import Link from 'next/link';
import { ProgressBar } from '@/components/ui';
import { KARTOCHKI_UI as T } from '@/content/kartochkiUi';
import { vyuchena } from '@/lib/kartochki/leitner';
import { useProgressKolody } from '@/lib/kartochki/progress';
import './kartochki.css';

export interface ProverkaTeoriiProps {
  task: number;
  /** Адрес вкладки «Карточки». */
  href: string;
  /** id карточек колоды: по ним считается «выучено». */
  ids: readonly string[];
}

/**
 * Кнопка «Проверить теорию» во вкладке «Теория» и рядом счётчик
 * «Теория №N: выучено K из M». Ведёт во вкладку «Карточки».
 */
export function ProverkaTeorii({ task, href, ids }: ProverkaTeoriiProps) {
  const progress = useProgressKolody(task);
  const n = ids.filter((id) => vyuchena(progress, id)).length;
  const text = T.vyucheno(task, n, ids.length);
  return (
    <div className="kart-proverka">
      <div className="kart-proverka__text">
        <p className="kart-proverka__title">{text}</p>
        <ProgressBar value={ids.length === 0 ? 0 : (n / ids.length) * 100} label={text} />
        <p className="t-caption kart-proverka__lead">{T.proveritTeoriyuLead}</p>
      </div>
      <Link className="btn btn--primary kart-proverka__btn" href={href}>
        {T.proveritTeoriyu}
      </Link>
    </div>
  );
}
