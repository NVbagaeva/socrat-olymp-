import type { Metadata } from 'next';
import { SiteFooter, SiteHeader } from '@/components/layout';
import {
  BankSection,
  CtaSection,
  DiagnosticsSection,
  HeroSection,
  HowSection,
  PathSection,
  TeachersSection,
} from '@/components/landing';
import { landing } from '@/content/landing';
import './landing.css';

export const metadata: Metadata = {
  title: landing.meta.title,
  description: landing.meta.description,
};

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <HeroSection />
        <HowSection />
        <DiagnosticsSection />
        <PathSection />
        <BankSection />
        <TeachersSection />
        <CtaSection />
      </main>
      <SiteFooter />
    </>
  );
}
