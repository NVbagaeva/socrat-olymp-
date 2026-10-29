import type { Metadata } from 'next';
import { SiteFooter, SiteHeader } from '@/components/layout';
import { BankSection, HeroSection, HowSection } from '@/components/landing';
import { landing } from '@/content/landing';
import { interSteklo } from '@/lib/fontsSteklo';
import './landing.css';

export const metadata: Metadata = {
  title: landing.meta.title,
  description: landing.meta.description,
};

export default function HomePage() {
  return (
    /* Главная — первая страница в «Стеклянной сцене»: свой шрифт
       (Inter Variable с осью opsz) и стеклянные шапка и подвал. Остальные
       страницы переходят на неё по одной. */
    <div className={`glavnaya ${interSteklo.variable}`}>
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
