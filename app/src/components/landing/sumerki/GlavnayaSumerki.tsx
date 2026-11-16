import { SiteFooter, SiteHeader } from '@/components/layout';
import type { Level } from '@/lib/level';
import { BankSection } from '../BankSection';
import { HowSection } from '../HowSection';
import { OtschyotSection } from '../otschyot/EgeOtschyot';
import { SumerkiHero } from './SumerkiHero';

/**
 * Главная с первым экраном «Сумеречная сцена». Всё ниже первого экрана —
 * те же блоки, что у нынешней главной (Glavnaya.tsx), без изменений.
 * Пока — только служебные страницы /styleguide/glavnaya-sumerki/.
 */
export function GlavnayaSumerki({
  vid,
  oreol = 'silnyy',
  level = 'profile',
}: {
  vid: 'a' | 'b';
  oreol?: 'silnyy' | 'myagkiy';
  level?: Level;
}) {
  return (
    <div className="glavnaya">
      <SiteHeader
        className={vid === 'a' ? 'site-head--steklo site-head--sumerki' : 'site-head--steklo'}
      />
      <main>
        <SumerkiHero vid={vid} oreol={oreol} level={level} />
        <OtschyotSection level={level} />
        <HowSection />
        <BankSection level={level} />
      </main>
      <SiteFooter className="site-foot--steklo" />
    </div>
  );
}
