import { SiteFooter, SiteHeader } from '@/components/layout';
import type { Level } from '@/lib/level';
import { BankSection } from './BankSection';
import { HeroSection } from './HeroSection';
import { HowSection } from './HowSection';

/**
 * Главная уровня: одна разметка на профиль (/) и базу (/baza/).
 * Отличаются только тексты и список заданий — content/landing.ts.
 */
export function Glavnaya({ level }: { level: Level }) {
  return (
    /* Главная — первая страница в «Стеклянной сцене»: стеклянные шапка
       и подвал, свечения, глянцевые кнопки. Шрифт — общий Inter Variable
       сайта (lib/fonts.ts). Остальные страницы переходят на сцену по одной. */
    <div className="glavnaya">
      <SiteHeader className="site-head--steklo" />
      <main>
        <HeroSection level={level} />
        <HowSection />
        {/* Сняты до появления самих функций — на главной только то, что
            работает. Компоненты и тексты на месте, вернуть — одна строка:
            DiagnosticsSection — диагностики нет («Пройти диагностику»);
            PathSection — персонального плана нет;
            TeachersSection — классов и назначения домашних нет;
            CtaSection — «Узнай свой балл за 25 минут», та же диагностика. */}
        <BankSection level={level} />
      </main>
      <SiteFooter className="site-foot--steklo" />
    </div>
  );
}
