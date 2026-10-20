import type { Metadata } from 'next';
import { Solid3Trainer } from '@/components/tasks/solid3/Solid3Trainer';
import { stereoTitle, vkladkaStereo } from '@/content/stereo/zadaniya';
import { wholePool } from '@/lib/zadanie3/pool';
import { ZADANIYA } from '@/lib/paths';
import { scopeOfPath } from '@/lib/trainerSession/scope';

const VKLADKA = vkladkaStereo('trenazher');

export const metadata: Metadata = {
  title: stereoTitle('3', VKLADKA),
};

/**
 * Вкладка «Тренажёр» №3: весь банк, группы и прототипы выбираются в
 * настройке. Условия набраны KaTeX и чертежи нарисованы на сборке;
 * ответы уходят в браузер только отпечатками. Раздел сессии — задание
 * целиком («3»): тренировка не теряется при переходе между вкладками
 * и в №15.
 */
export default function Page() {
  const base = `${ZADANIYA}/3`;
  return (
    <>
      <h2 className="t-h2 vtab__title">{VKLADKA}</h2>
      <Solid3Trainer pool={wholePool()} scope={scopeOfPath(base) ?? '3'} backHref={`${base}/`} />
    </>
  );
}
