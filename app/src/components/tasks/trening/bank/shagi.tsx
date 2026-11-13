import type { ReactNode } from 'react';
import { typeset } from '@/lib/tex';
import type { Shag } from '../../steklo';
import type { VoprosPodskazki } from '../PodskazkaVoprosy';

/**
 * Разбор банка раздела шагами «Стеклянной сцены» — без правки
 * содержания. Разбор у №7, №6, №10, №11 устроен одинаково: подписанные
 * этапы («Шаг 2. ОДЗ» и строки с $…$), панель «Считаем с умом» и
 * подсказки-вопросы. Работает и на сборке, и в браузере.
 */

export interface EtapRazbora {
  title: string;
  lines: string[];
}

export interface StrokaSchyota {
  tekst: string;
  /** TeX без $; пусто — только пояснение. */
  tex?: string;
}

export interface VoprosRazbora {
  question: string;
  options: string[];
  correct: number;
  comment?: string;
}

/** «Шаг 3. Преобразования» → «Преобразования»: номер ставит сам список. */
export function nazvanieEtapa(title: string): string {
  return title.replace(/^Шаг \d+\.\s*/, '');
}

/**
 * Этапы → шаги: название этапа становится названием шага, строки — его
 * текстом. `risunok` — таблица или рисунок этапа (у №6), `ton` — цвет
 * шага («ОДЗ», «Отбор корней» у №7).
 */
export function shagiIzEtapov<E extends EtapRazbora>(
  etapy: readonly E[],
  {
    risunok,
    ton,
  }: {
    risunok?: (etap: E) => ReactNode;
    ton?: (zagolovok: string) => Shag['ton'];
  } = {},
): Shag[] {
  return etapy.map((e) => {
    const zag = nazvanieEtapa(e.title);
    const r = risunok?.(e);
    const t = ton?.(zag);
    return {
      zagolovok: zag,
      chtoHtml: e.lines.map((line) => `<p>${typeset(line)}</p>`).join(''),
      formulaHtml: '',
      ...(t === undefined ? {} : { ton: t }),
      ...(r === undefined || r === null ? {} : { risunok: r }),
    };
  });
}

/** Панель «Считаем с умом» под шагами: приёмы счёта из разбора банка. */
export function schitaemSUmomPanel(
  vychisleniya: readonly StrokaSchyota[],
  title: string,
): ReactNode {
  if (vychisleniya.length === 0) {
    return undefined;
  }
  return (
    <details className="trn-posle">
      <summary className="stk-summary">
        {title}
        <span className="stk-shevron" aria-hidden="true" />
      </summary>
      <ul>
        {vychisleniya.map((c, i) => (
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
export function voprosyIzRazbora(hints: readonly VoprosRazbora[]): VoprosPodskazki[] {
  return hints.map((h) => ({
    voprosHtml: typeset(h.question),
    variantyHtml: h.options.map((o) => typeset(o)),
    verno: h.correct,
    ...(h.comment === undefined || h.comment === ''
      ? {}
      : { kommentariyHtml: typeset(h.comment) }),
  }));
}

/** Ответ для бланка: запятая и настоящий минус. */
export function otvetTekstom(answer: number): string {
  return String(answer).replace('.', ',').replace('-', '−');
}
