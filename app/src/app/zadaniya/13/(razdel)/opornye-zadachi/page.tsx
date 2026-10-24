import type { Metadata } from 'next';
import { Opornye13List, type BlokKartochka13 } from '@/components/tasks/zadanie13/Opornye13List';
import { Opornye13Shell } from '@/components/tasks/zadanie13/Opornye13Shell';
import { OPORNYE } from '@/content/opornye';
import { ZADANIE13, zadanie13Title } from '@/content/zadanie13';
import { BLOKI_13, zadachiBloka } from '@/lib/zadanie13/opornye/bloki';
import { ZADANIYA } from '@/lib/paths';

export const metadata: Metadata = {
  title: zadanie13Title(OPORNYE.title),
};

/**
 * Вкладка «Опорные задачи» №13: 17 блоков по схемам. Список лёгкий —
 * без задач: они запечатываются на странице блока.
 */
export default function Opornye13Tab() {
  const listHref = `${ZADANIYA}/${ZADANIE13.slug}/${OPORNYE.tail}`;
  const bloki: BlokKartochka13[] = BLOKI_13.map((b) => ({
    id: b.id,
    slug: b.slug,
    no: b.no,
    nazvanie: b.nazvanie,
    lead: b.lead,
    total: zadachiBloka(b).length,
  }));
  return (
    <Opornye13Shell listHref={listHref} totals={bloki.map((b) => ({ id: b.id, total: b.total }))}>
      <Opornye13List bloki={bloki} listHref={listHref} />
    </Opornye13Shell>
  );
}
