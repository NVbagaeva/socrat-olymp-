import type { Metadata } from 'next';
/* Подсказка-вопросы и разбор — те же стили, что у карточки задачи банка. */
import '@/components/tasks/card/problem-card.css';
import type { SsylkiTipa } from '@/components/trenazher/types';
import { Trenazher18 } from '@/components/zadanie18/Trenazher18';
import { ZADANIE18, vkladka18, zadanie18Title } from '@/content/zadanie18';
import { OPORNYE_18 } from '@/content/zadanie18/opornye';
import { ZADANIYA } from '@/lib/paths';
import { typeset } from '@/lib/tex';
import { bank18, trenazherConfig18, zadachi18 } from '@/lib/zadanie18/trenazher/bank';

const VKLADKA = vkladka18('trenazher');

export const metadata: Metadata = {
  title: zadanie18Title(VKLADKA),
};

/**
 * Вкладка «Тренажёр» №18: задачи уровня ЕГЭ по ключевым схемам на
 * общей панели фильтров. Банк собирается здесь, на сборке: условия в
 * KaTeX, ответы пункта б) — отпечатками, подсказки и разборы закрыты.
 */
export default function Trenazher18Tab() {
  const base = `${ZADANIYA}/${ZADANIE18.slug}`;
  /* Итоги: к схеме с ошибкой — её страница и опорная задача на неё. */
  const config = trenazherConfig18();
  const ssylki: Record<string, SsylkiTipa> = {};
  for (const t of config.temy) {
    for (const p of t.podtipy) {
      const op = OPORNYE_18.find((z) => z.skhemy.includes(p.id));
      ssylki[p.id] = {
        teoriya: `${base}/skhemy/${p.id}/`,
        ...(op === undefined ? {} : { opornye: `${base}/opornye-zadachi/${op.id}/` }),
      };
    }
  }
  return (
    <>
      <h2 className="t-h2 vtab__title">{VKLADKA}</h2>
      <Trenazher18
        config={config}
        refs={zadachi18()}
        bank={bank18(typeset)}
        backHref={`${base}/`}
        ssylki={ssylki}
      />
    </>
  );
}
