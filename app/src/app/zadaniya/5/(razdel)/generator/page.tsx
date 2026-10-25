import type { Metadata } from 'next';
import { Generator45 } from '@/components/tasks/veroyatnost/Generator45';
import { navykiZadaniya } from '@/components/tasks/veroyatnost/metody';
import { syuzhetyPrototipov } from '@/components/tasks/veroyatnost/navyki';
import { VariantFromSection } from '@/components/variant/VariantEntry';
import { veroyatnostTitle, vkladka } from '@/content/veroyatnost';
import { config45 } from '@/lib/veroyatnost/generator45';
import { bank5Pool } from '@/lib/veroyatnost/pool';
import { ZADANIYA } from '@/lib/paths';

const BASE = `${ZADANIYA}/5`;

export const metadata: Metadata = {
  title: veroyatnostTitle('5', vkladka('5', 'generator')),
};

/**
 * Вкладка «Генератор» задания №5 на общем компоненте: темы — методы
 * автора, подтипы — сюжеты банка. Листы ученика и учителя — из одного
 * набора, код комплекта в адресе.
 */
export default function Generator5Tab() {
  return (
    <>
      {/* Название вкладки — H2 панели; у экрана генератора свой заголовок ниже. */}
      <h2 className="t-h2 vtab__title">{vkladka('5', 'generator')}</h2>
      <VariantFromSection />
      <Generator45
        config={config45(5, BASE, navykiZadaniya(5), syuzhetyPrototipov(bank5Pool()))}
        base={BASE}
        zadanie={5}
      />
    </>
  );
}
