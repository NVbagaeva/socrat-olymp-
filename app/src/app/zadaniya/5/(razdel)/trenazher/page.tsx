import type { Metadata } from 'next';
import { Trenazher } from '@/components/tasks/veroyatnost/Trenazher';
import { navykiMetodov } from '@/components/tasks/veroyatnost/navyki';
import { veroyatnostTitle, vkladka } from '@/content/veroyatnost';
import { bank5Pool, bezRazborov, uznayMetodPool, versiyaRazborov } from '@/lib/veroyatnost/pool';
import { ZADANIYA } from '@/lib/paths';

export const metadata: Metadata = {
  title: veroyatnostTitle('5', vkladka('5', 'trenazher')),
};

/**
 * Вкладка «Тренажёр» задания №5 — тот же тренажёр, что у задания №4:
 * конфигуратор задания №12, режимы отработки, смешанный, повтор
 * ошибок и «Узнай метод», прогресс по шести методам.
 *
 * Банк собирается на сборке: у каждого прототипа варианты задачника
 * и сгенерированные. Со страницей уезжают условия, открытые параметры
 * рисунка и отпечатки ответов. Закрытые разборы и подсказки весят
 * мегабайты и почти не сжимаются, поэтому лежат файлами по прототипам
 * (dannye/razbory/) и грузятся только для задач подхода.
 */
export default function Trenazher5Tab() {
  const pool = bank5Pool();
  return (
    <>
      {/* Название вкладки — H2 панели: конфигуратор и подход — общие с №12 экраны без своего заголовка. */}
      <h2 className="t-h2 vtab__title">{vkladka('5', 'trenazher')}</h2>
      <Trenazher
        pool={bezRazborov(pool)}
        versiyaRazborov={versiyaRazborov(pool)}
        uznay={uznayMetodPool(5)}
        zadanie={5}
        base={`${ZADANIYA}/5/trenazher/`}
        metody={navykiMetodov(pool, 5)}
      />
    </>
  );
}
