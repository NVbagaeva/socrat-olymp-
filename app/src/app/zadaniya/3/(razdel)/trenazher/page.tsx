import type { Metadata } from 'next';
/* Подсказка-вопросы и разбор — те же стили, что у карточки задачи банка. */
import '@/components/tasks/card/problem-card.css';
import { Pechat3Panel } from '@/components/tasks/solid3/Pechat3Panel';
import { Trenazher3 } from '@/components/tasks/solid3/Trenazher3';
import type { SsylkiTipa } from '@/components/trenazher/types';
import { TIPY_3 } from '@/content/stereo/tipy';
import { RAZDELY } from '@/lib/zadanie3';
import { estScenariy } from '@/lib/zadanie3/chertezhi';
import { fipiVarianta } from '@/lib/zadanie3/fipi';
import { trenazherConfig3, zadachi3 } from '@/lib/zadanie3/trenazher/filtry3';
import { stereoTitle, vkladkaStereo } from '@/content/stereo/zadaniya';
import { wholePool } from '@/lib/zadanie3/pool';
import { href, ZADANIYA } from '@/lib/paths';
import { typeset } from '@/lib/tex';

const VKLADKA = vkladkaStereo('trenazher');

export const metadata: Metadata = {
  title: stereoTitle('3', VKLADKA),
};

/**
 * Вкладка «Тренажёр» №3 на общей панели фильтров: разделы и прототипы
 * — фильтры сверху, открытый банк ФИПИ или нет. Условия набраны KaTeX
 * и чертежи нарисованы на сборке; ответы уходят в браузер только
 * отпечатками. Раздел сессии — задание целиком («3»).
 */
export default function Page() {
  const base = `${ZADANIYA}/3`;
  /* Итоги: к прототипу с ошибкой — глава теории его типа. */
  const ssylki: Record<string, SsylkiTipa> = {};
  for (const t of TIPY_3) {
    for (const n of t.prototipy ?? []) {
      ssylki[`P03-${String(n).padStart(2, '0')}`] = {
        teoriya: `${base}/teoriya/#teoriya-${t.glava}`,
      };
    }
  }
  return (
    <>
      <h2 className="t-h2 vtab__title">{VKLADKA}</h2>
      <Trenazher3
        pool={wholePool()}
        config={trenazherConfig3(RAZDELY, typeset)}
        refs={zadachi3(RAZDELY, fipiVarianta)}
        backHref={`${base}/`}
        ssylki={ssylki}
      />
      {/* Листы для печати — у разделов с многогранниками: их чертежи — сценарии. */}
      <Pechat3Panel
        razdely={RAZDELY.filter((r) => r.prototipy.some(estScenariy)).map((r) => ({
          base: href(base, 'pechat', r.slug),
          nazvanie: r.nazvanie,
        }))}
      />
    </>
  );
}
