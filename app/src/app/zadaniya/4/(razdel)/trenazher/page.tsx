import type { Metadata } from 'next';
import { Trenazher } from '@/components/tasks/veroyatnost/Trenazher';
import { navykiMetodov } from '@/components/tasks/veroyatnost/navyki';
import { tasksPage } from '@/content/tasks';
import { veroyatnostBySlug, veroyatnostTitle } from '@/content/veroyatnost';
import { bank4Pool, uznayMetodPool } from '@/lib/veroyatnost/pool';

export const metadata: Metadata = {
  title: veroyatnostTitle('4', 'Тренажёр'),
};

/**
 * Вкладка «Тренажёр» задания №4 — раздел 07 референса на конфигураторе
 * задания №12: метод, режим, количество задач; «Узнай метод» — один
 * из режимов.
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
    <Trenazher
      pool={pool}
      uznay={uznayMetodPool(4)}
      zadanie={4}
      base={`${tasksPage.href}/4/trenazher/`}
      family={veroyatnostBySlug('4')?.title ?? ''}
      skills={navykiMetodov(pool, 4)}
    />
  );
}
