import { SiteFooter, SiteHeader } from '@/components/layout';
import type { Level } from '@/lib/level';
import { BankSection } from './BankSection';
import { AvtorPolosa } from './AvtorPolosa';
import { HeroSection, type HeroDobavki } from './HeroSection';
import { TarifyKratko } from './TarifyKratko';
import { HowSection } from './HowSection';
import { OtschyotSection } from './otschyot/EgeOtschyot';

/**
 * Главная уровня: одна разметка на профиль (/) и базу (/baza/).
 * Отличаются только тексты и список заданий — content/landing.ts.
 */
/**
 * Добавки главной (docs/audit-prodazhi.md, волна 2): плашка автора и
 * блок цен. По умолчанию их нет — боевая главная та же, что была;
 * варианты размещения — /styleguide/prodazhi/.
 *   avtorPolosa  — плашка автора отдельной полосой между «вечером» и банком;
 *   tarifyBlok   — короткий блок цен до или после банка заданий.
 */
export interface DobavkiGlavnoy {
  hero?: HeroDobavki;
  avtorPolosa?: boolean;
  tarifyBlok?: 'doBanka' | 'posleBanka';
}

export function Glavnaya({ level, dobavki = {} }: { level: Level; dobavki?: DobavkiGlavnoy }) {
  return (
    /* Главная — первая страница в «Стеклянной сцене»: стеклянные шапка
       и подвал, свечения, глянцевые кнопки. Шрифт — общий Inter Variable
       сайта (lib/fonts.ts). Остальные страницы переходят на сцену по одной. */
    <div className="glavnaya">
      <SiteHeader className="site-head--steklo" />
      <main>
        <HeroSection level={level} {...(dobavki.hero ? { dobavki: dobavki.hero } : {})} />
        {/* Обратный отсчёт до ЕГЭ — сразу после первого экрана. Даты —
            config/ege-countdown.ts. */}
        <OtschyotSection level={level} />
        <HowSection />
        {/* Сняты до появления самих функций — на главной только то, что
            работает. Компоненты и тексты на месте, вернуть — одна строка:
            DiagnosticsSection — диагностики нет («Пройти диагностику»);
            PathSection — персонального плана нет;
            TeachersSection — классов и назначения домашних нет;
            CtaSection — «Узнай свой балл за 25 минут», та же диагностика. */}
        {dobavki.avtorPolosa ? <AvtorPolosa /> : null}
        {dobavki.tarifyBlok === 'doBanka' ? <TarifyKratko /> : null}
        <BankSection level={level} />
        {dobavki.tarifyBlok === 'posleBanka' ? <TarifyKratko /> : null}
      </main>
      <SiteFooter className="site-foot--steklo" />
    </div>
  );
}
