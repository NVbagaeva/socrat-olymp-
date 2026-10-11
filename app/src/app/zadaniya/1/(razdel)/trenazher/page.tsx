import type { Metadata } from 'next';
import { Trenazher1 } from '@/components/tasks/planimetriya/Trenazher1';
import { TRENAZHER_1, ZADANIE1, zadanie1Title } from '@/content/zadanie1';
import { ZADANIYA } from '@/lib/paths';
import { dannyeTrenazhera1 } from '@/lib/planimetriya/trenazher/dannye';
/* Экраны тренажёра, генератора и «Для репетиторов» — слой №11
   (z11-*): подключается без правок, свои добавки №1 — trenazher1.css. */
import '../../../11/zadanie11.css';
import '../../../komplekt.css';
import '../../trenazher1.css';
/* Общий экран итогов оболочки сессии (tdone, tkind) — оформление
   итога тренажёров №12, как у №2, №4, №5 и №8. */
import '../../../[task]/[type]/trainer.css';

export const metadata: Metadata = {
  title: zadanie1Title(TRENAZHER_1.title),
};

/**
 * Вкладка «Тренажёр» задания №1 — как у №11. Блоки, прототипы,
 * счётчики и числа задач банка без ответов собираются на сборке;
 * задачи тренировки — в браузере, ответ закрывается отпечатком сразу
 * после решения движком.
 */
export default function Trenazher1Tab() {
  return <Trenazher1 dannye={dannyeTrenazhera1()} base={`${ZADANIYA}/${ZADANIE1.slug}`} />;
}
