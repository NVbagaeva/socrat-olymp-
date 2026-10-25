'use client';

import { useSearchParams } from 'next/navigation';
import { ShapkaRazdela } from '@/components/tasks/ShapkaRazdela';
import { POV_HREF, POV_SCREEN, POV_VERSION_LABEL } from '@/content/povyshennye';
import { VARIANT_HREF, VARIANT_SCREEN } from '@/content/variant';
import { ONLINE_TEXT as T } from '@/content/variantOnline/text';
import { povNomer, versiyaText } from '@/lib/povyshennye/kod';

/** Шапка «Решать онлайн» по умолчанию — раздел «Собрать вариант». */
export function ShapkaReshatObshchaya() {
  return (
    <ShapkaRazdela
      crumbs={[
        { label: VARIANT_SCREEN.crumbs.home, href: '/' },
        { label: VARIANT_SCREEN.title, href: VARIANT_HREF },
        { label: T.panel.title },
      ]}
      title={T.panel.title}
    />
  );
}

/**
 * Шапка страницы решения: у версии раздела повышенной сложности —
 * крошки раздела и «Вариант 7.3», у партии «Собрать вариант» — как было.
 * Код в адресе, страница статическая — шапка решается в браузере.
 */
export function ShapkaReshat() {
  const q = useSearchParams();
  const pv = povNomer(q.get('kod') ?? '');
  const v = Number(q.get('v') ?? '1');
  if (pv === null || !Number.isInteger(v) || v < 1) return <ShapkaReshatObshchaya />;
  const label = POV_VERSION_LABEL(versiyaText(pv, v));
  return (
    <ShapkaRazdela
      crumbs={[
        { label: POV_SCREEN.crumbs.home, href: '/' },
        { label: POV_SCREEN.title, href: POV_HREF },
        { label },
      ]}
      title={label}
    />
  );
}
