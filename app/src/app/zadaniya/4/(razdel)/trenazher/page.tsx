import type { Metadata } from 'next';
import { Trenazher } from '@/components/tasks/veroyatnost/Trenazher';
import { navykiMetodov } from '@/components/tasks/veroyatnost/navyki';
import { veroyatnostTitle, vkladka } from '@/content/veroyatnost';
import { bank4Pool, bezRazborov, uznayMetodPool, versiyaRazborov } from '@/lib/veroyatnost/pool';
import { ZADANIYA } from '@/lib/paths';

export const metadata: Metadata = {
  title: veroyatnostTitle('4', vkladka('4', 'trenazher')),
};

/**
 * Вкладка «Тренажёр» задания №4 — по макету trenazher.png: методы,
 * режим, количество задач; «Узнай метод» — один из режимов.
 *
 * Банк собирается на сборке: у каждого прототипа варианты задачника
 * и сгенерированные. Со страницей уезжают условия, открытые параметры
 * рисунка и отпечатки ответов. Закрытые разборы и подсказки весят
 * мегабайты и почти не сжимаются, поэтому лежат файлами по прототипам
 * (dannye/razbory/) и грузятся только для задач подхода.
 */
export default function Trenazher4Tab() {
  const pool = bank4Pool();
  return (
    <>
      {/* Название вкладки — H2 панели: конфигуратор и подход — общие с №12 экраны без своего заголовка. */}
      <h2 className="t-h2 vtab__title">{vkladka('4', 'trenazher')}</h2>
      <Trenazher
        pool={bezRazborov(pool)}
        versiyaRazborov={versiyaRazborov(pool)}
        uznay={uznayMetodPool(4)}
        zadanie={4}
        base={`${ZADANIYA}/4/trenazher/`}
        metody={navykiMetodov(pool, 4)}
      />
    </>
  );
}
