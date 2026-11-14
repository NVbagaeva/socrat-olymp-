import type { ReactNode } from 'react';
import type { Razbor } from '@/lib/veroyatnost/razbor';
import { Vizualizatsiya, podpisRisunka } from '../../card/Vizualizatsiya';
import type { Shag } from '../../steklo';
import type { VoprosPodskazki } from '../../trening';
import type { PodskazkaShag } from '@/lib/veroyatnost/razbor';
import { VykladkaKlient } from '../VykladkaKlient';

/** Текст шага — простой текст банка: в разметку как есть, без тегов. */
function tekst(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Решение задачи №4 и №5 шагами «Стеклянной сцены». Содержание разбора
 * — дословно из банка: этап — название шага, пояснение — подпись,
 * формула — выкладка, которую карточка рвёт на строки по ширине
 * (VykladkaKlient, как и прежде). Формул отдельной строкой HTML нет:
 * выкладка встаёт в место рисунка шага.
 */
export function shagi45(razbor: Razbor): Shag[] {
  return razbor.shagi.map((s) => ({
    zagolovok: s.etap,
    chtoHtml: `<p>${tekst(s.text)}</p>`,
    formulaHtml: '',
    ...(s.vykladka === undefined
      ? {}
      : { risunok: <VykladkaKlient className="z45-vykladka" vykladka={s.vykladka} /> }),
  }));
}

/**
 * Рисунок метода с подсветкой благоприятного (движок
 * components/probability): после ответа или раскрытого решения — как
 * было на карточке задачи. У метода «Формула» рисунка нет.
 */
export function risunok45(razbor: Razbor, verno: boolean, podpis: string): ReactNode {
  if (razbor.parametry === undefined) {
    return null;
  }
  return (
    <figure className="z45-risunok" aria-label={podpis}>
      <figcaption className="z45-risunok__podpis">
        {podpisRisunka(razbor.parametry, razbor.podsvetka)}
      </figcaption>
      <Vizualizatsiya
        parametry={razbor.parametry}
        podsvetka={razbor.podsvetka}
        state={verno ? 'correct' : 'default'}
      />
    </figure>
  );
}

/** Подсказка-вопросы банка — в общем виде (уже набраны KaTeX на сборке). */
export function voprosy45(podskazka: readonly PodskazkaShag[]): VoprosPodskazki[] {
  return podskazka.map((h) => ({
    voprosHtml: h.question,
    variantyHtml: h.options,
    verno: h.correct,
    ...(h.comment === null ? {} : { kommentariyHtml: h.comment }),
  }));
}
