import type { Metadata } from 'next';
import { Trenazher1 } from '@/components/tasks/planimetriya/Trenazher1';
import { ZADANIE1 } from '@/content/zadanie1';
import { ZADANIYA } from '@/lib/paths';
import { typeset } from '@/lib/tex';
import { dannyeTrenazhera1 } from '@/lib/planimetriya/trenazher/dannye';
import { trenazherConfig1, zadachi1 } from '@/lib/planimetriya/trenazher/filtry1';
/* Экраны тренажёра, генератора и «Для репетиторов» — слой №11
   (z11-*): подключается без правок, свои добавки №1 — trenazher1.css. */
import '../../../11/zadanie11.css';
import '../../../komplekt.css';
import '../../trenazher1.css';
import { metaVkladki } from '@/content/seo';
import { BlokRazdela } from '@/components/seo/BlokRazdela';

export const metadata: Metadata = metaVkladki(1, 'trenazher');

/**
 * Вкладка «Тренажёр» задания №1 на общей панели фильтров. Блоки,
 * прототипы, список задач и числа банка без ответов — на сборке;
 * задачи тренировки — в браузере, ответ закрывается отпечатком сразу
 * после решения движком.
 */
export default function Trenazher1Tab() {
  const dannye = dannyeTrenazhera1();
  return (
    <>
      <Trenazher1
        dannye={dannye}
        config={trenazherConfig1(dannye, typeset)}
        refs={zadachi1(dannye)}
        base={`${ZADANIYA}/${ZADANIE1.slug}`}
      />
      <BlokRazdela no={1} vid="trenazher" />
    </>
  );
}
