import type { Metadata } from 'next';
import { KartaStranica } from '@/components/karta/KartaStranica';
import { KARTA_TEKST } from '@/content/karta/teksty';

export const metadata: Metadata = {
  title: `${KARTA_TEKST.nazvanie} — Будет на ЕГЭ`,
  description:
    'Карта заданий ЕГЭ по математике: какие задания освоены, что стоит повторить и с чего продолжить.',
  robots: { index: false },
};

/**
 * «Карта ЕГЭ»: вошедшему — его прогресс из аккаунта, гостю — из этого
 * браузера с плашкой «Войдите, чтобы карта запоминала прогресс».
 */
export default function KartaPage() {
  return <KartaStranica />;
}
