import type { Metadata } from 'next';
import { VariantStranitsa } from '@/components/variant/VariantStranitsa';
import { VARIANT_SCREEN as T } from '@/content/variant';

export const metadata: Metadata = {
  title: `${T.title} — Будет на ЕГЭ`,
  description: T.lead,
};

export default function VariantPage() {
  return <VariantStranitsa level="profile" />;
}
