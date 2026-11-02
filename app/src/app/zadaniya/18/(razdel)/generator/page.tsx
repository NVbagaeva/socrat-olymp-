import type { Metadata } from 'next';
import { Generator18 } from '@/components/zadanie18/Generator18';
import { ZADANIE18, vkladka18, zadanie18Title } from '@/content/zadanie18';
import { SOBRANNYE } from '@/content/zadanie18/spisok';
import { GRUPPY_18 } from '@/content/zadanie18/tipy';
import { TIPY_18 } from '@/content/zadanie18/trenazher';
import { ZADANIYA } from '@/lib/paths';
import { typeset } from '@/lib/tex';
import { bank18 } from '@/lib/zadanie18/trenazher/bank';

const VKLADKA = vkladka18('generator');

export const metadata: Metadata = {
  title: zadanie18Title(VKLADKA),
};

/**
 * Вкладка «Генератор» задания №18: листы ученика и учителя из одного
 * набора, варианты, PDF. Темы — группы ключевых схем, типы задач — из
 * тренажёра. Банк собирается здесь, на сборке: условия в KaTeX, ответы
 * и решения закрыты; в браузер не уходят открытые ответы.
 */
export default function Generator18Tab() {
  const tipy = TIPY_18.map((t) => {
    const s = SOBRANNYE.find((x) => x.id === t.skhema);
    return {
      id: t.id,
      nazvanie: t.nazvanie,
      uroven: t.uroven,
      tema: s?.gruppa ?? '',
      skhemaNo: s?.no ?? 0,
    };
  });
  return (
    <>
      <h2 className="t-h2 vtab__title">{VKLADKA}</h2>
      <Generator18
        temy={GRUPPY_18.map((g) => ({ id: g.id, title: g.title }))}
        tipy={tipy}
        bank={bank18(typeset)}
        base={`${ZADANIYA}/${ZADANIE18.slug}`}
      />
    </>
  );
}
