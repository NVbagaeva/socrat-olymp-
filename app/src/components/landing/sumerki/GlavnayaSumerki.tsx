import { SiteFooter, SiteHeader } from '@/components/layout';
import type { ReactNode } from 'react';
import type { Level } from '@/lib/level';
import { BankSection } from '../BankSection';
import { OtschyotSection } from '../otschyot/EgeOtschyot';
import { Proba } from '../proba/Proba';
import { SumerkiHero } from './SumerkiHero';
import { Vitrina } from './Vitrina';

/**
 * Главная со сценой в первом экране. Ниже — живая задача (Proba), банк
 * заданий плиткой вперёд, обратный отсчёт и витрина возможностей
 * (Vitrina); секции — в ровном ритме (sumerki.css).
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
  /** Часть витрины после тренажёра: на главной профиля — StereoChast (живая стереометрия). */
  vitrinaPosle?: ReactNode;
}) {
  return (
    <div className="glavnaya glavnaya--scena">
      <SiteHeader className="site-head--steklo" />
      <main>
        <SumerkiHero vid={vid} oreol={oreol} level={level} />
        {/* Сразу под первым экраном — дело: задача, которую решают на
            месте без входа, и плитка заданий — до любого один щелчок. */}
        <Proba />
        <BankSection level={level} plitkaSnachala />
        <OtschyotSection level={level} />
        <Vitrina zagolovok={zagolovok} posle={vitrinaPosle} />
      </main>
      <SiteFooter className="site-foot--steklo" />
    </div>
  );
}
