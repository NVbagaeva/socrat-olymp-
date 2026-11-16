import { SiteFooter, SiteHeader } from '@/components/layout';
import type { Level } from '@/lib/level';
import { BankSection } from '../BankSection';
import { OtschyotSection } from '../otschyot/EgeOtschyot';
import { SumerkiHero } from './SumerkiHero';
import { VecherKartochki } from './VecherKartochki';

/**
 * Главная с синей сценой в первом экране. Ниже — те же блоки, что у
 * нынешней главной (Glavnaya.tsx); блок «вечер» — новыми карточками
 * (VecherKartochki), секции — в ровном ритме (sumerki.css).
 * Пока — только служебные страницы /styleguide/glavnaya-sumerki/.
 */
export function GlavnayaSumerki({
  vid,
  oreol = 'silnyy',
  level = 'profile',
}: {
  vid: 'vitrina';
  oreol?: 'silnyy' | 'myagkiy';
  level?: Level;
}) {
  return (
    <div className="glavnaya glavnaya--scena">
      <SiteHeader className="site-head--steklo" />
      <main>
        <SumerkiHero vid={vid} oreol={oreol} level={level} />
        <OtschyotSection level={level} />
        <VecherKartochki />
        <BankSection level={level} />
      </main>
      <SiteFooter className="site-foot--steklo" />
    </div>
  );
}
