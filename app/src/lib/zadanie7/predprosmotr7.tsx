/**
 * Предпросмотр листа №7 в общем генераторе: та же модель листа и те же
 * компоненты, что у страницы печати (List7), — в строку HTML. Модуль
 * грузится при первой сборке листа вместе с банком и решателями.
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { RamkiTeorii7 } from '@/components/tasks/zadanie7/RamkiTeorii7';
import { Razbor7 } from '@/components/tasks/zadanie7/Razbor7';
import { GEN_UI } from '@/content/generatorUi';
import { TEORIYA_7_DLYA_PROTOTIPA } from '@/content/teoriya7';
import type { ListHtml, SobratListHtml } from '@/lib/generator/obshchiy/bankEngine';
import { typeset } from '@/lib/tex';
import { zagruzitIndeks, zagruzitZadachi, type IndeksZadachi, type ZadachaLite } from './dannye';
import { parseZapros, parseZaprosKlyuchi, sobratList, sobratListKlyuchi } from './sborka';

/** Откуда брать банк: в браузере — файлы public/data, в проверке — с диска. */
export interface Dannye7 {
  indeks: () => Promise<IndeksZadachi[]>;
  zadachi: (protos: string[]) => Promise<Map<string, ZadachaLite>>;
}

const BRAUZER: Dannye7 = { indeks: zagruzitIndeks, zadachi: zagruzitZadachi };

function otvetText(x: number): string {
  return String(x).replace('.', ',').replace('-', '−');
}

export function sobratList7(dannye: Dannye7 = BRAUZER): SobratListHtml {
  return async (q) => {
    const indeks = await dannye.indeks();
    const zk = parseZaprosKlyuchi(q);
    const z = zk === null ? parseZapros(q) : null;
    const model =
      zk !== null ? sobratListKlyuchi(zk, indeks) : z !== null ? sobratList(z, indeks) : null;
    if (model === null) return null;
    const ids = model.bloki.flatMap((b) => [...b.spiski.flat(), ...(b.primery ?? [])]);
    const protos = [...new Set(indeks.filter((x) => ids.includes(x.id)).map((x) => x.p))];
    const [zadachi, mod] = await Promise.all([dannye.zadachi(protos), import('./prototypes')]);
    /* Условие №7 — одна строка с уравнением, без рисунка. */
    const uslovie = (x: ZadachaLite) => `<p class="z7-list__uslovie">${typeset(x.text)}</p>`;
    const l: ListHtml = {
      bloki: model.bloki,
      zadacha(id) {
        const x = zadachi.get(id);
        if (x === undefined) return null;
        const s = mod.prototype(x.prototypeId).solve(x.params);
        return {
          question: uslovie(x),
          answer: typeset(otvetText(s.answer)),
          solution: renderToStaticMarkup(<Razbor7 s={s} />),
          analog: x.source === 'analog',
        };
      },
      pamyatka: (p) =>
        `<div class="gen-recap"><b>${model.bloki[0]?.title ?? ''}</b>${renderToStaticMarkup(
          <RamkiTeorii7 prototipy={p} />,
        )}</div>`,
      primer(id) {
        const x = zadachi.get(id);
        if (x === undefined) return '';
        const s = mod.prototype(x.prototypeId).solve(x.params);
        const title = TEORIYA_7_DLYA_PROTOTIPA(x.prototypeId)?.title ?? '';
        return (
          `<div class="gen-example"><span class="gen-example__label">${GEN_UI.primer}</span>` +
          `<p class="gen-example__title">${typeset(title)}</p>` +
          `<div class="gen-example__q">${uslovie(x)}</div>` +
          `<div class="gen-example__sol">${renderToStaticMarkup(<Razbor7 s={s} />)}` +
          `<p>Ответ: <b>${typeset(otvetText(s.answer))}</b></p></div></div>`
        );
      },
    };
    return l;
  };
}
