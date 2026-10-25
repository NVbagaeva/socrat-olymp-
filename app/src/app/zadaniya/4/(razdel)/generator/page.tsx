import type { Metadata } from 'next';
import { Generator45 } from '@/components/tasks/veroyatnost/Generator45';
import { navykiZadaniya } from '@/components/tasks/veroyatnost/metody';
import { syuzhetyPrototipov } from '@/components/tasks/veroyatnost/navyki';
import { VariantFromSection } from '@/components/variant/VariantEntry';
import { veroyatnostTitle, vkladka } from '@/content/veroyatnost';
import { config45 } from '@/lib/veroyatnost/generator45';
import { bank4Pool } from '@/lib/veroyatnost/pool';
import { ZADANIYA } from '@/lib/paths';

const BASE = `${ZADANIYA}/4`;

export const metadata: Metadata = {
  title: veroyatnostTitle('4', vkladka('4', 'generator')),
};

/**
 * Вкладка «Генератор» задания №4 на общем компоненте: темы — методы
 * автора, подтипы — сюжеты банка. Листы ученика и учителя — из одного
 * набора, код комплекта в адресе.
 */
export default function Generator4Tab() {
  return (
    <>
      {/* Название вкладки — H2 панели; у экрана генератора свой заголовок ниже. */}
      <h2 className="t-h2 vtab__title">{vkladka('4', 'generator')}</h2>
      <VariantFromSection />
      <Generator45
        config={config45(4, BASE, navykiZadaniya(4), syuzhetyPrototipov(bank4Pool()))}
        base={BASE}
        zadanie={4}
      />
    </>
  );
}
