import type { Metadata } from 'next';
import { SiteFooter, SiteHeader } from '@/components/layout';
import { BankSection, HeroSection, HowSection } from '@/components/landing';
import './landing.css';
import { SEO_STRANITSY } from '@/content/seo';

export const metadata: Metadata = SEO_STRANITSY.glavnaya;

export default function HomePage() {
  return (
    /* Главная — первая страница в «Стеклянной сцене»: стеклянные шапка
       и подвал, свечения, глянцевые кнопки. Шрифт — общий Inter Variable
       сайта (lib/fonts.ts). Остальные страницы переходят на сцену по одной. */
    <div className="glavnaya">
      <SiteHeader className="site-head--steklo" />
      <main>
        <HeroSection />
        <HowSection />
        {/* Сняты до появления самих функций — на главной только то, что
            работает. Компоненты и тексты на месте, вернуть — одна строка:
            DiagnosticsSection — диагностики нет («Пройти диагностику»);
            PathSection — персонального плана нет;
            TeachersSection — классов и назначения домашних нет;
            CtaSection — «Узнай свой балл за 25 минут», та же диагностика. */}
        <BankSection />
      </main>
      <SiteFooter className="site-foot--steklo" />
    </div>
  );
}
