/**
 * Разбор уравнения №7 строкой HTML — та же разметка, что у
 * components/tasks/zadanie7/Razbor7.tsx (лист учителя List7, тренажёр):
 * подписанные этапы, этапы «ОДЗ» и «Отбор корней» выделены классами
 * `z7-razbor__etap--odz` / `--otbor`, панель «Считаем с умом». Стили —
 * components/tasks/zadanie7/razbor7.css.
 *
 * Отличий два: панель «Считаем с умом» раскрыта (`open`) — на
 * печатном листе закрытая панель показала бы только заголовок; строка
 * «**Ответ:** …» последнего этапа не печатается — ответ стоит своей
 * строкой под разбором (как в lib/variant/adapters/common.ts).
 * Меняется Razbor7 — меняется и здесь.
 */

import { typeset } from '@/lib/tex';
import type { Etap, Solved } from '@/lib/zadanie7/types';

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Строка ответа в этапе: «**Ответ:** $17$.» */
const OTVET = /^\s*\*{0,2}Ответ:/;

function vid(e: Etap): string {
  if (e.title.endsWith('ОДЗ')) return 'z7-razbor__etap z7-razbor__etap--odz';
  if (e.title.endsWith('Отбор корней')) return 'z7-razbor__etap z7-razbor__etap--otbor';
  return 'z7-razbor__etap';
}

export function razbor7Html(s: Solved): string {
  const etapy = s.etapy
    .map(
      (e) =>
        `<section class="${vid(e)}"><h4 class="z7-razbor__title">${esc(e.title)}</h4>` +
        e.lines
          .filter((l) => !OTVET.test(l))
          .map((l) => `<p class="z7-razbor__line"><span>${typeset(l)}</span></p>`)
          .join('') +
        `</section>`,
    )
    .join('');
  const calc =
    s.vychisleniya.length === 0
      ? ''
      : `<details class="z7-razbor__calc" open><summary>Считаем с умом</summary><ul>` +
        s.vychisleniya
          .map(
            (c) =>
              `<li><span>${typeset(c.tekst)}</span>` +
              (c.tex
                ? `<span class="z7-razbor__calc-tex"><span>${typeset(`$${c.tex}$`)}</span></span>`
                : '') +
              `</li>`,
          )
          .join('') +
        `</ul></details>`;
  return `<div class="z7-razbor">${etapy}${calc}</div>`;
}
