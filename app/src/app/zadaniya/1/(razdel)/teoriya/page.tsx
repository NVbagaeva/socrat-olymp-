import type { Metadata } from 'next';
import { Teoriya1 } from '@/components/tasks/planimetriya/Teoriya1';
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
 * Вкладка «Теория» задания №1: тринадцать разделов справочника,
 * содержание рядом. Страница серверная: формулы набирает KaTeX,
 * чертежи рисует движок планиметрии на сборке; живые чертежи
 * оживают в браузере.
 */
export default function Teoriya1Tab() {
  return (
    <Teoriya1 vkladka={VKLADKA} spravochnik={`${BASE}/pechat/spravochnik/`} trenazher={trenazher} />
  );
}
