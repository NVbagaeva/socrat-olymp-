/**
 * Куски листа генератора базы — общие для предпросмотра в генераторе
 * (predprosmotrBazy.ts) и листа печати (sheetBazy.ts): условие, чертёж
 * условия (№12), ответ и краткий разбор по этапам решателя прототипа.
 * Формулы набраны KaTeX (lib/tex): лист и экран показывают одно и то же.
 */

import { typeset } from '@/lib/tex';
import type { Etap, ZadachaLite } from './types';

/** Условие задачи — абзац с формулами. */
export function uslovieBazy(z: Pick<ZadachaLite, 'text'>): string {
  return `<p class="baza-list__uslovie">${typeset(z.text)}</p>`;
}

/** Условие с чертежом под ним — для предпросмотра. */
export function uslovieSRisunkom(z: Pick<ZadachaLite, 'text' | 'risunok'>): string {
  return (
    uslovieBazy(z) +
    (z.risunok === undefined ? '' : `<div class="baza-list__risunok">${z.risunok}</div>`)
  );
}

/** Ответ строкой листа: запись бланка, минус — настоящий. */
export function otvetBazy(otvet: string): string {
  return otvet.replace(/-/g, '−');
}

/** Разбор по этапам решателя: <div class="baza-razbor"> с секциями этапов. */
export function razborBazy(etapy: readonly Etap[]): string {
  return (
    '<div class="baza-razbor">' +
    etapy
      .map(
        (e) =>
          '<section class="baza-razbor__etap">' +
          `<h4 class="baza-razbor__title">${typeset(e.title)}</h4>` +
          e.lines.map((l) => `<p class="baza-razbor__line">${typeset(l)}</p>`).join('') +
          '</section>',
      )
      .join('') +
    '</div>'
  );
}
