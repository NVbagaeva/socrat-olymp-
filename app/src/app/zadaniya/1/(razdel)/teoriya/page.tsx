import type { Metadata } from 'next';
import { ProverkaTeorii } from '@/components/kartochki/ProverkaTeorii';
import { kolodaNomera } from '@/content/kartochki';
import { Spravochnik1 } from '@/components/tasks/planimetriya/spravochnik/Spravochnik1';
import { ZADANIE1, zadanie1Title } from '@/content/zadanie1';
import { ZADANIYA } from '@/lib/paths';
import { klyuchProto } from '@/lib/planimetriya/trenazher/sessiya';

const VKLADKA = ZADANIE1.tabs.find((tab) => tab.id === 'teoriya')?.label ?? 'Теория';
const BASE = `${ZADANIYA}/${ZADANIE1.slug}`;

export const metadata: Metadata = {
  title: zadanie1Title(VKLADKA),
};

/** Номер прототипа в «Где на ЕГЭ» открывает тренажёр на этом прототипе. */
function trenazher(proto: number): string {
  return `${BASE}/trenazher/?tipy=${klyuchProto(proto)}`;
}

/**
 * Вкладка «Теория» задания №1 — «Справочник по планиметрии»: разделы
 * и карточки из content/spravochnik1, содержание рядом. Страница
 * серверная: формулы набирает KaTeX, чертежи рисует движок
 * планиметрии на сборке.
 */
export default function Teoriya1Tab() {
  return (
    <>
      <ProverkaTeorii
        task={1}
        href={`${BASE}/kartochki/`}
        ids={kolodaNomera(1).kartochki.map((k) => k.id)}
      />
      <Spravochnik1
        trenazher={trenazher}
        pdf={`${BASE}/pechat/spravochnik/`}
        adresa={{ zadanie: `${BASE}/`, teoriya: `${BASE}/teoriya/` }}
      />
    </>
  );
}
