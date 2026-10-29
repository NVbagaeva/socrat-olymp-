/**
 * Часть 2 в HTML: строки решения со ссылками на теоремы и карточки
 * теорем. Одна функция для экрана (ссылка — кнопка, открывает окно)
 * и листа (ссылка — подчёркнутый текст, карточки — в конце листа
 * учителя).
 */

import { MAX_BALL } from '@/content/variantOnline/bally';
import { kriteriiZadaniya } from '@/content/variantOnline/kriterii';
import { katex } from '@/lib/graph/katex';
import { chertezhTeoremy, SSYLKA, ssylkiV, teorema } from '@/lib/teoremy';
import { typeset, typesetKrupno } from '@/lib/tex';
import type { Chast2Zadacha, Ramka } from './types';

export type Vyvod = 'ekran' | 'list';

/** Строка с $…$ и {{t:id|текст}} → HTML. */
export function strokaHtml(text: string, vyvod: Vyvod = 'ekran'): string {
  let out = '';
  let last = 0;
  for (const m of text.matchAll(SSYLKA)) {
    out += typeset(text.slice(last, m.index));
    const id = m[1]!;
    const nazv = teorema(id).nazvanie;
    const vnutri = typeset(m[2]!);
    out +=
      vyvod === 'ekran'
        ? /* Ссылка, а не кнопка: длинная формулировка переносится по словам. */
          `<a class="teor-ssylka" href="#teorema-${id}" role="button" data-teorema="${id}" title="${nazv}">${vnutri}</a>`
        : `<span class="teor-ssylka" data-teorema="${id}">${vnutri}</span>`;
    last = m.index + m[0].length;
  }
  return out + typeset(text.slice(last));
}

/** Абзацы условия (через \n). */
export function uslovieHtml(text: string): string {
  return text
    .split('\n')
    .map((p) => `<p>${typesetKrupno(p)}</p>`)
    .join('');
}

/** Карточка теоремы: название, формулировка, чертёж, доказательство. */
export function teoremaHtml(id: string, shirina = 240): string {
  const t = teorema(id);
  return (
    `<article class="teor" data-teorema-karta="${id}">` +
    `<h3 class="teor__t">${typeset(t.nazvanie)}</h3>` +
    `<p class="teor__f">${typeset(t.formulirovka)}</p>` +
    `<figure class="teor__ris">${chertezhTeoremy(id, shirina)}</figure>` +
    `<h4 class="teor__dt">${t.zagolovokDok ?? 'Доказательство'}</h4>` +
    `<ol class="teor__dok">${t.dokazatelstvo.map((s) => `<li>${typeset(s)}</li>`).join('')}</ol>` +
    `</article>`
  );
}

/** Теоремы, на которые ссылаются решения задач, — без повторов, по порядку. */
export function teoremyZadach(zadachi: readonly Chast2Zadacha[]): string[] {
  const ids: string[] = [];
  for (const z of zadachi)
    for (const e of z.reshenie)
      for (const l of e.lines) for (const id of ssylkiV(l)) if (!ids.includes(id)) ids.push(id);
  return ids;
}

/**
 * Значки рамок — поле 24×24, обводка currentColor, как у Callout
 * (components/ui/Callout.tsx): теория — закладка «Запомни»,
 * примечание — «i» в круге, как у сноски.
 */
const ZNAK_RAMKI: Record<Ramka['vid'], string> = {
  teoriya: '<path d="M7 4.5h10a.5.5 0 0 1 .5.5v14.5L12 16l-5.5 3.5V5a.5.5 0 0 1 .5-.5z"/>',
  primechanie: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8v.3"/>',
};
const METKA_RAMKI: Record<Ramka['vid'], string> = {
  teoriya: 'Теория',
  primechanie: 'Примечание',
};

/**
 * Рамка решения на плашке Callout (styles/callout.css): теория — синим
 * тоном «Запомни», примечание — тёплым тоном «Лайфхак»; форма у них
 * одна, роль видна по метке и значку и на ч/б печати.
 */
export function ramkaHtml(r: Ramka, vyvod: Vyvod = 'ekran'): string {
  const ton = r.vid === 'teoriya' ? 'zapomni' : 'layfhak';
  const abz = (ls: readonly string[]) => ls.map((l) => `<p>${strokaHtml(l, vyvod)}</p>`).join('');
  return (
    `<aside class="callout callout--${ton} c2-ramka c2-ramka--${r.vid}">` +
    `<p class="callout__metka"><svg class="callout__znak" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ZNAK_RAMKI[r.vid]}</svg>${METKA_RAMKI[r.vid]}</p>` +
    `<div class="callout__telo">` +
    `<p class="c2-ramka__t">${typeset(r.title)}</p>` +
    abz(r.lines) +
    (r.formula === undefined
      ? ''
      : `<div class="c2-ramka__formula">${katex.renderToString(r.formula, { throwOnError: false, displayMode: true })}</div>`) +
    abz(r.posle ?? []) +
    `</div></aside>`
  );
}

/** Решение учителя: этапы с подписью, рамка теории, строки, чертёж этапа. */
export function reshenieHtml(z: Chast2Zadacha, vyvod: Vyvod = 'ekran'): string {
  return (
    `<ol class="c2-etapy">` +
    z.reshenie
      .map(
        (e) =>
          `<li class="c2-etap"><p class="c2-etap__t">${typeset(e.title)}</p>` +
          (e.risunok === undefined ? '' : `<figure class="c2-etap__ris">${e.risunok}</figure>`) +
          (e.ramka === undefined ? '' : ramkaHtml(e.ramka, vyvod)) +
          `<ul class="c2-etap__l">${e.lines.map((l) => `<li>${strokaHtml(l, vyvod)}</li>`).join('')}</ul>` +
          (e.melko === undefined
            ? ''
            : `<div class="c2-etap__melko">${e.melko.map((l) => `<p>${strokaHtml(l, vyvod)}</p>`).join('')}</div>`) +
          `</li>`,
      )
      .join('') +
    `</ol>`
  );
}

/** Разбор ученика: шаг словами и формула. */
export function razborHtml(z: Chast2Zadacha): string {
  return (
    `<ol class="var-razbor c2-razbor">` +
    z.razbor
      .map(
        (s) =>
          `<li class="var-razbor__step"><span class="c2-razbor__s">${typeset(s.slovo)}</span>` +
          (s.formula === undefined
            ? ''
            : ` <span class="c2-razbor__f">${typeset(`$${s.formula}$`)}</span>`) +
          `</li>`,
      )
      .join('') +
    `</ol>`
  );
}

/** Таблица критериев задания — компактно, для листа учителя. */
export function kriteriiHtml(z: Chast2Zadacha): string {
  const rows = kriteriiZadaniya(z.no, z.utochnenie)
    .map(
      (k) =>
        `<tr><td>${k.ili
          .map((s, j) => (j === 0 ? '' : '<span class="c2-krit-print__or">ИЛИ</span>') + typeset(s))
          .join('<br>')}</td><td class="c2-krit-print__b">${k.ball}</td></tr>`,
    )
    .join('');
  return (
    `<table class="c2-krit-print"><thead><tr><th>Содержание критерия</th><th>Баллы</th></tr></thead>` +
    `<tbody>${rows}<tr class="c2-krit-print__max"><td>Максимальный балл</td><td class="c2-krit-print__b">${MAX_BALL[z.no]}</td></tr></tbody></table>`
  );
}
