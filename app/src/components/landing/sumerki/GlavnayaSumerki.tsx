import { SiteFooter, SiteHeader } from '@/components/layout';
import type { ReactNode } from 'react';
import type { Level } from '@/lib/level';
import { BankSection } from '../BankSection';
import { OtschyotSection } from '../otschyot/EgeOtschyot';
import { SumerkiHero } from './SumerkiHero';
import { Vitrina } from './Vitrina';

/**
 * Главная с синей сценой в первом экране. Ниже — те же блоки, что у
 * нынешней главной (Glavnaya.tsx); вместо блока «вечер» — витрина
 * возможностей (Vitrina), секции — в ровном ритме (sumerki.css).
 * Боевая главная профиля (app/page.tsx) и /styleguide/glavnaya-sumerki/.
 */
export function GlavnayaSumerki({
  vid,
  oreol = 'silnyy',
  zagolovok = 'a',
  level = 'profile',
  vitrinaPosle,
}: {
  vid: 'vitrina';
  oreol?: 'silnyy' | 'myagkiy';
  /** Вариант заголовка витрины (content/vitrina.ts). */
  zagolovok?: 'a' | 'b';
  level?: Level;
  /** Часть витрины после тренажёра (прототип: StereoChast — /styleguide/glavnaya-stereo/). */
  vitrinaPosle?: ReactNode;
}) {
  return (
    <div className="glavnaya glavnaya--scena">
      <SiteHeader className="site-head--steklo" />
      <main>
        <SumerkiHero vid={vid} oreol={oreol} level={level} />
        <OtschyotSection level={level} />
        <Vitrina zagolovok={zagolovok} posle={vitrinaPosle} />
        <BankSection level={level} />
      </main>
      <SiteFooter className="site-foot--steklo" />
    </div>
  );
}
