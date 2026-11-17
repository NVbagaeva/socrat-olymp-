import Link from 'next/link';
import { USTNYY } from '@/content/ustnyySchet';
import { href, USTNYY as USTNYY_HREF } from '@/lib/paths';
import { RAZMINKI, razminkaHref, type RazminkaId } from '@/lib/ustnyySchet/razminka';
import { tipograf } from '@/lib/tipograf';
import './razminka.css';

/**
 * Карточка «Разминка: устный счёт» на странице задания с вычислениями:
 * серия из 10 примеров нужных приёмов и ссылка в раздел.
 */
export function Razminka({ id }: { id: RazminkaId }) {
  const T = USTNYY.razminka;
  return (
    <aside className="us-razminka" aria-labelledby={`us-razminka-${id}`}>
      <p className="us-razminka__metka" aria-hidden="true">
        ×÷
      </p>
      <div className="us-razminka__tekst">
        <h3 className="us-razminka__zag" id={`us-razminka-${id}`}>
          {T.zag}
        </h3>
        <p className="us-razminka__lead">{tipograf(RAZMINKI[id].lead)}</p>
        <div className="us-razminka__knopki">
          <Link className="btn btn--primary btn--sm" href={razminkaHref(id)}>
            {T.start}
          </Link>
          <Link className="btn btn--ghost btn--sm" href={href(USTNYY_HREF)}>
            {T.vse}
          </Link>
        </div>
      </div>
    </aside>
  );
}
