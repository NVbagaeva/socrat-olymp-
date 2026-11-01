import type { Metadata } from 'next';
import { Trenazher } from '@/components/tasks/veroyatnost/Trenazher';
import { navykiMetodov } from '@/components/tasks/veroyatnost/navyki';
import { vkladka } from '@/content/veroyatnost';
import { bank4Pool, uznayMetodPool } from '@/lib/veroyatnost/pool';
import { ZADANIYA } from '@/lib/paths';
import { metaVkladki } from '@/content/seo';
import { BlokRazdela } from '@/components/seo/BlokRazdela';

export const metadata: Metadata = metaVkladki(4, 'trenazher');

/**
 * Вкладка «Тренажёр» задания №4 — по макету trenazher.png: методы,
 * режим, количество задач; «Узнай метод» — один из режимов.
 *
 * Банк собирается на сборке: 21 прототип, у каждого варианты
 * задачника и десять сгенерированных. Вниз уезжают условия, открытые
 * параметры рисунка, отпечатки ответов и закрытые разборы — формулы
 * ответа и перебор исходов остаются здесь. Карточки методов с
 * миниатюрами тоже собираются здесь, на сервере.
 */
export default function Trenazher4Tab() {
  const pool = bank4Pool();
  return (
    <>
      {/* Название вкладки — H2 панели: конфигуратор и подход — общие с №12 экраны без своего заголовка. */}
      <h2 className="t-h2 vtab__title">{vkladka('4', 'trenazher')}</h2>
      <Trenazher
        pool={pool}
        uznay={uznayMetodPool(4)}
        zadanie={4}
        base={`${ZADANIYA}/4/trenazher/`}
        metody={navykiMetodov(pool, 4)}
      />
      <BlokRazdela no={4} vid="trenazher" />
    </>
  );
}
