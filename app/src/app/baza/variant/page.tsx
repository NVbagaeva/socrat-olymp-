import type { Metadata } from 'next';
import { VariantStranitsa } from '@/components/variant/VariantStranitsa';
import { VARIANT_BAZY as B } from '@/content/baza/variant';

export const metadata: Metadata = {
  title: `${B.title} — Будет на ЕГЭ`,
  description: B.description,
};

/** Сборщик варианта в режиме базы: тот же экран, уровень — «База». */
export default function BazaVariantPage() {
  return <VariantStranitsa level="base" />;
}
