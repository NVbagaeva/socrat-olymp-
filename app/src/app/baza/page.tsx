import type { Metadata } from 'next';
import { ogStranicy } from '@/lib/og';
import { Glavnaya } from '@/components/landing/Glavnaya';
import { landingOf } from '@/content/landing';
import '../landing.css';

const { meta } = landingOf('base');

/* Свои заголовок и описание — под запросы «ЕГЭ база математика». */
export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  openGraph: ogStranicy(meta.title, meta.description),
  alternates: { canonical: '/baza/' },
};

/** Главная базовой математики: та же разметка, что у профиля. */
export default function BazaHomePage() {
  return <Glavnaya level="base" />;
}
