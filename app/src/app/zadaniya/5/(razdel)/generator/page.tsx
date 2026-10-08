import type { Metadata } from 'next';
import { GeneratorSyuzhety } from '@/components/tasks/veroyatnost/GeneratorSyuzhety';
import { navykiZadaniya } from '@/components/tasks/veroyatnost/metody';
import { syuzhetyPrototipov } from '@/components/tasks/veroyatnost/navyki';
import { veroyatnostTitle, vkladka } from '@/content/veroyatnost';
import { bank5Pool } from '@/lib/veroyatnost/pool';
import { ZADANIYA } from '@/lib/paths';

export const metadata: Metadata = {
  title: veroyatnostTitle('5', vkladka('5', 'generator')),
};

/**
 * Вкладка «Генератор» задания №5: вариант для печати по макету.
 *
 * Сюжеты — прототипы банка, сгруппированные по методам автора.
 * Картинок сюжетов у №5 пока нет: на карточках стоят значки
 * методов.
 * Кнопки ведут на страницы печати раздела: там лист собирается из тех
 * же прототипов по параметрам адреса.
 */
export default function Generator5Tab() {
  return (
    <>
      {/* Название вкладки — H2 панели; у экрана генератора свой заголовок ниже. */}
      <h2 className="t-h2 vtab__title">{vkladka('5', 'generator')}</h2>
      <GeneratorSyuzhety
        zadanie={5}
        base={`${ZADANIYA}/5`}
        metody={navykiZadaniya(5)}
        syuzhety={syuzhetyPrototipov(bank5Pool())}
        kartinki={{}}
      />
    </>
  );
}
