import type { Metadata } from 'next';
import { Trenazher } from '@/components/tasks/veroyatnost/Trenazher';
import { navykiMetodov } from '@/components/tasks/veroyatnost/navyki';
import { tasksPage } from '@/content/tasks';
import { veroyatnostFamily, veroyatnostTitle, vkladka } from '@/content/veroyatnost';
import { bank5Pool, uznayMetodPool } from '@/lib/veroyatnost/pool';

export const metadata: Metadata = {
  title: veroyatnostTitle('5', vkladka('5', 'trenazher')),
};

/**
 * Вкладка «Тренажёр» задания №5 — тот же тренажёр, что у задания №4:
 * конфигуратор задания №12, режимы отработки, смешанный, повтор
 * ошибок и «Узнай метод», прогресс по шести методам.
 *
 * Банк собирается на сборке: 12 прототипов, у каждого варианты
 * задачника и десять сгенерированных. Вниз уезжают условия, открытые
 * параметры рисунка, отпечатки ответов и закрытые разборы.
 */
export default function Trenazher5Tab() {
  const pool = bank5Pool();
  return (
    <>
      {/* Название вкладки — H2 панели: конфигуратор и подход — общие с №12 экраны без своего заголовка. */}
      <h2 className="t-h2 vtab__title">{vkladka('5', 'trenazher')}</h2>
      <Trenazher
        pool={pool}
        uznay={uznayMetodPool(5)}
        zadanie={5}
        base={`${tasksPage.href}/5/trenazher/`}
        family={veroyatnostFamily('5')}
        skills={navykiMetodov(pool, 5)}
      />
    </>
  );
}
