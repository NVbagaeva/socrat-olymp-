import type { ReactNode } from 'react';
import { SHAPKA7 } from '@/content/uravneniya7';
import { typeset } from '@/lib/tex';
import type { Solved } from '@/lib/zadanie7/types';
import type { Shag } from '../steklo';
import type { VoprosPodskazki } from '../trening';

/**
 * Решение уравнения №7 шагами «Стеклянной сцены».
 *
 * Разбор банка — подписанные этапы («Шаг 2. ОДЗ» и строки с формулами)
 * — переводится в общие шаги без правки содержания: название этапа
 * становится названием шага, строки — его текстом. ОДЗ и отбор корней
 * выделены цветом. Работает и на сборке, и в браузере.
 */

/** «Шаг 3. Преобразования» → «Преобразования»: номер ставит сам список. */
function nazvanie(title: string): string {
  return title.replace(/^Шаг \d+\.\s*/, '');
}

/**
 * ОДЗ записываем всегда. У уравнений без ограничений (линейные,
 * показательные, синус и косинус) в разборе банка этапа «ОДЗ» нет —
 * тогда вторым шагом идёт эта строка. Содержания разбора она не
 * меняет: говорит только, что ограничений нет.
 */
export const ODZ_BEZ_OGRANICHENIY = 'Ограничений нет: $x$ — любое число.';

export function shagiIzResheniya(s: Solved): Shag[] {
  const shagi: Shag[] = s.etapy.map((e) => {
    const zag = nazvanie(e.title);
    return {
      zagolovok: zag,
      chtoHtml: e.lines.map((line) => `<p>${typeset(line)}</p>`).join(''),
      formulaHtml: '',
      ...(zag === 'ОДЗ'
        ? { ton: 'odz' as const }
        : zag === 'Отбор корней'
          ? { ton: 'otbor' as const }
          : {}),
    };
  });
  if (!shagi.some((shag) => shag.zagolovok === 'ОДЗ')) {
    shagi.splice(Math.min(1, shagi.length), 0, {
      zagolovok: 'ОДЗ',
      chtoHtml: `<p>${typeset(ODZ_BEZ_OGRANICHENIY)}</p>`,
      formulaHtml: '',
      ton: 'odz',
    });
  }
  return shagi;
}

/** Панель «Считаем с умом» под шагами: приёмы счёта из разбора банка. */
export function schitaemSUmom(s: Solved): ReactNode {
  if (s.vychisleniya.length === 0) {
    return undefined;
  }
  return (
    <details className="trn-posle">
      <summary className="stk-summary">
        {SHAPKA7.schitaem}
        <span className="stk-shevron" aria-hidden="true" />
      </summary>
      <ul>
        {s.vychisleniya.map((c, i) => (
          <li key={i}>
            <span dangerouslySetInnerHTML={{ __html: typeset(c.tekst) }} />
            {c.tex === undefined || c.tex === '' ? null : (
              <span
                className="trn-posle__tex"
                dangerouslySetInnerHTML={{ __html: typeset(`$${c.tex}$`) }}
              />
            )}
          </li>
        ))}
      </ul>
    </details>
  );
}

/** Подсказки-вопросы разбора — в общем виде (готовый HTML). */
export function voprosyIzResheniya(s: Solved): VoprosPodskazki[] {
  return s.hints.map((h) => ({
    voprosHtml: typeset(h.question),
    variantyHtml: h.options.map((o) => typeset(o)),
    verno: h.correct,
    ...(h.comment === undefined || h.comment === '' ? {} : { kommentariyHtml: typeset(h.comment) }),
  }));
}

/** Ответ для бланка: запятая и настоящий минус. */
export function otvetTekstom(answer: number): string {
  return String(answer).replace('.', ',').replace('-', '−');
}
