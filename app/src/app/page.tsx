import type { Metadata } from 'next';
import { SiteFooter, SiteHeader } from '@/components/layout';
import {
  BankSection,
  CtaSection,
  HeroSection,
  RouteSection,
  TutorsSection,
} from '@/components/landing';
import { landing } from '@/content/landing';
import './landing.css';

export const metadata: Metadata = {
  title: landing.meta.title,
  description: landing.meta.description,
};

/**
 * Порядок блоков — порядок знакомства ученика с продуктом: что это,
 * как устроен маршрут, из каких заданий выбирать. Блок для репетитора
 * стоит после них и короче: репетитор пользуется той же системой.
 */
export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <HeroSection />
        <RouteSection />
        <BankSection />
        <TutorsSection />
        <CtaSection />
      </main>
      <SiteFooter />
    </>
  );
}
