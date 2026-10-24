/**
 * Разбор задачи №10 строкой HTML — та же разметка, что у
 * components/tasks/zadanie10/Razbor10.tsx (серверный компонент, в кусок
 * адаптера его не взять): таблица «Дано», подписанные этапы и панель
 * «Считаем с умом». Решения не пишет — только раскладывает `Solved`
 * решателя прототипа. На листе панель раскрыта (`open`): печать
 * свёрнутое не покажет. Строка «Ответ:» из последнего этапа снята —
 * ответ стоит отдельной строкой разбора.
 */

import { typeset } from '@/lib/tex';
import type { Solved } from '@/lib/zadanie10/types';

const OTVET = /^\s*\*{0,2}Ответ:/;

export function razbor10Html(s: Solved): string {
  const [pervyy, ...ostalnye] = s.etapy;
  const dano =
    pervyy === undefined
      ? ''
      : `<section class="z10-razbor__etap"><h4 class="z10-razbor__title">${typeset(pervyy.title)}</h4>` +
        `<table class="z10-dano"><thead><tr><th scope="col">Величина</th><th scope="col">Значение</th>` +
        `<th scope="col">Что это</th></tr></thead><tbody>${s.dano
          .map(
            (r) =>
              `<tr><td>${typeset(`$${r.oboz}$`)}</td><td>${typeset(`$${r.znach}$`)}${
                r.ed === '' ? '' : `<span class="z10-dano__ed"> ${typeset(r.ed)}</span>`
              }</td><td>${typeset(r.smysl)}</td></tr>`,
          )
          .join('')}</tbody></table></section>`;
  const etapy = ostalnye
    .map((e) => {
      const lines = e.lines.filter((l) => !OTVET.test(l));
      if (lines.length === 0) return '';
      return (
        `<section class="z10-razbor__etap"><h4 class="z10-razbor__title">${typeset(e.title)}</h4>` +
        lines.map((l) => `<p class="z10-razbor__line">${typeset(l)}</p>`).join('') +
        `</section>`
      );
    })
    .join('');
  const calc =
    s.vychisleniya.length === 0
      ? ''
      : `<details class="z10-razbor__calc" open><summary>Считаем с умом</summary><ul>${s.vychisleniya
          .map(
            (c) =>
              `<li>${typeset(c.tekst)}${
                c.tex === undefined || c.tex === ''
                  ? ''
                  : `<span class="z10-razbor__calc-tex">${typeset(`$${c.tex}$`)}</span>`
              }</li>`,
          )
          .join('')}</ul></details>`;
  return `<div class="z10-razbor">${dano}${etapy}${calc}</div>`;
}
