import type { Metadata } from 'next';
import { Trenazher13 } from '@/components/tasks/zadanie13/Trenazher13';
import { TRENAZHER_13, ZADANIE13, zadanie13Title } from '@/content/zadanie13';
import { BANK_13 } from '@/lib/zadanie13/bank';
import { prototypes } from '@/lib/zadanie13/generate';
import { ZADANIYA } from '@/lib/paths';

export const metadata: Metadata = {
  title: zadanie13Title(TRENAZHER_13.title),
};

/**
 * Вкладка «Тренажёр» задания №13. Реестр прототипов и банк seed
 * собираются на сборке; задачи тренировки — в браузере, ответ
 * закрывается отпечатком сразу после сборки задачи движком.
 */
export default function Trenazher13Tab() {
  const protos = prototypes().map((p) => ({ id: p.id, type: p.type, difficulty: p.difficulty }));
  return (
    <Trenazher13
      protos={protos}
      bank={BANK_13.map(([id, seed]) => [id, seed] as const)}
      base={`${ZADANIYA}/${ZADANIE13.slug}`}
    />
  );
}
