import type { Metadata } from 'next';
import { GeneratorSyuzhety } from '@/components/tasks/veroyatnost/GeneratorSyuzhety';
import { navykiZadaniya } from '@/components/tasks/veroyatnost/metody';
import { syuzhetyPrototipov } from '@/components/tasks/veroyatnost/navyki';
import { veroyatnostTitle, vkladka } from '@/content/veroyatnost';
import { KARTINKI_SYUZHETOV } from '@/content/veroyatnost-syuzhety';
import { bank4Pool } from '@/lib/veroyatnost/pool';
import { ZADANIYA } from '@/lib/paths';

export const metadata: Metadata = {
  title: veroyatnostTitle('4', vkladka('4', 'generator')),
};

/**
 * Вкладка «Генератор» задания №4: вариант для печати по макету.
 *
 * Сюжеты — прототипы банка, сгруппированные по методам автора.
 * Картинки сюжетов — из content/veroyatnost-syuzhety; у сюжета без
 * картинки на карточке стоит значок метода.
 * Кнопки ведут на страницы печати раздела: там лист собирается из тех
 * же прототипов по параметрам адреса.
 */
export default function Generator4Tab() {
  return (
    <>
      {/* Название вкладки — H2 панели; у экрана генератора свой заголовок ниже. */}
      <h2 className="t-h2 vtab__title">{vkladka('4', 'generator')}</h2>
      <GeneratorSyuzhety
        zadanie={4}
        base={`${ZADANIYA}/4`}
        metody={navykiZadaniya(4)}
        syuzhety={syuzhetyPrototipov(bank4Pool())}
        kartinki={KARTINKI_SYUZHETOV}
      />
    </>
  );
}
