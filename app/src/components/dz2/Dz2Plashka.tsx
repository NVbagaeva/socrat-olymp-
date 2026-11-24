'use client';

/**
 * Плашка над карточками раздела, когда ученик пришёл из ДЗ (PR 2в):
 * сколько карточек уже засчитано и ссылка обратно к ДЗ.
 */

import Link from 'next/link';
import { DZ2 } from '@/content/dz2';
import { DZ2_ON } from '@/lib/dz2/config';
import { dz2ReshatHref } from '@/lib/dz2/links';
import { useOtmetka } from '@/lib/dz2/otmetka';
import './dz2.css';

const t = DZ2.uchenik;

export function Dz2PlashkaKartochek({ taskNo }: { taskNo: number }) {
  const o = useOtmetka(taskNo);
  if (!DZ2_ON || o === null) return null;
  return (
    <p className="dz2-plashka" role="status" data-dz2-item={o.item}>
      <span>
        {t.vkladkaDzTekst(o.title)} {t.cel.kartochki(Math.min(o.ids.length, o.need), o.need)}.
      </span>{' '}
      <Link href={dz2ReshatHref(o.homework)}>{t.vernutsyaVDz}</Link>
    </p>
  );
}
