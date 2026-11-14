import type { Metadata } from 'next';
import { Glavnaya } from '@/components/landing/Glavnaya';
import { landingOf } from '@/content/landing';
import '../landing.css';

const { meta } = landingOf('base');

/* Свои заголовок и описание — под запросы «ЕГЭ база математика». */
export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
};

/** Главная базовой математики: та же разметка, что у профиля. */
export default function BazaHomePage() {
  return <Glavnaya level="base" />;
}
